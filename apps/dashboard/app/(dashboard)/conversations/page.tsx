"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Send, User, Phone, Calendar, Search, MoreVertical, Paperclip, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, formatWhatsAppDate } from "@/lib/utils";

// --- Types ---

interface Message {
    _id: string;
    sender: 'CUSTOMER' | 'BOT' | 'AGENT';
    content: string;
    createdAt: string;
    status: string;
}

interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
}

interface Conversation {
    _id: string;
    customer: Customer;
    status: string;
    assignedTo: 'BOT' | 'AGENT';
    updatedAt: string;
    lastMessage?: Message;
}

// --- Page Component ---

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [input, setInput] = useState("");

    // Derived state
    const selectedConversation = conversations.find(c => c._id === selectedId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Conversations
    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/conversations');
            setConversations(data.conversations);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        // Optional: Poll for new conversations every 30s
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch Messages when selection changes
    useEffect(() => {
        if (!selectedId) return;

        const fetchMessages = async () => {
            try {
                const { data } = await api.get(`/conversations/${selectedId}/messages`);
                setMessages(data.messages);
                // Use requestAnimationFrame to ensure DOM has updated before scrolling
                requestAnimationFrame(() => {
                    scrollToBottom(true); // instant scroll on initial load
                });
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
    }, [selectedId]);

    const scrollToBottom = (instant = false) => {
        if (instant) {
            // Instant scroll for initial message load - no visible animation
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        } else {
            // Smooth scroll for new messages during conversation
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedId) return;

        // Optimistic update
        const tempId = Math.random().toString(36).substring(7);
        const optimisticMessage: Message = {
            _id: tempId,
            sender: 'AGENT',
            content: input.trim(),
            createdAt: new Date().toISOString(),
            status: 'SENDING'
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setInput("");
        scrollToBottom();

        try {
            await api.post(`/conversations/${selectedId}/messages`, { content: optimisticMessage.content });
            const { data } = await api.get(`/conversations/${selectedId}/messages`);
            setMessages(data.messages);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => prev.filter(m => m._id !== tempId));
        }
    };

    const handleAssignmentChange = async (newStatus: 'BOT' | 'AGENT') => {
        if (!selectedId) return;
        try {
            await api.patch(`/conversations/${selectedId}/assign`, { assignedTo: newStatus });
            setConversations(prev => prev.map(c =>
                c._id === selectedId ? { ...c, assignedTo: newStatus } : c
            ));
        } catch (error) {
            console.error("Failed to update assignment", error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] -m-6 overflow-hidden bg-background">

            {/* --- Left Sidebar: Conversation List --- */}
            <div className="w-80 flex flex-col border-r border-border/50 bg-card/50">
                <div className="p-4 border-b border-border/50">
                    <h2 className="font-semibold mb-4 text-lg">Inbox</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." className="pl-9" />
                    </div>
                </div>

                <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block">
                    <div className="flex flex-col">
                        {isLoading ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">Loading chats...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">No active conversations</div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedId(conv._id)}
                                    className={cn(
                                        "group flex items-start gap-3 p-4 text-left transition-all duration-200 border-b border-border/30 last:border-0",
                                        selectedId === conv._id
                                            ? "bg-primary/10 border-l-2 border-l-primary"
                                            : "hover:bg-muted/50"
                                    )}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {conv.customer?.firstName?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium truncate">
                                                {conv.customer ? `${conv.customer.firstName} ${conv.customer.lastName || ''}` : 'Unknown Customer'}
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {conv.updatedAt ? formatWhatsAppDate(conv.updatedAt) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                                                {conv.lastMessage?.content || "No messages"}
                                            </p>
                                            <div 
                                                role="button"
                                                tabIndex={0}
                                                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center justify-center hover:bg-muted rounded cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* --- Middle: Chat Window --- */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col bg-muted/30 relative">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {selectedConversation.customer?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">
                                    {selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedConversation.customer?.phone}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 z-10">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender === 'AGENT' || msg.sender === 'BOT';
                                const isBot = msg.sender === 'BOT';
                                return (
                                    <div
                                        key={msg._id}
                                        className={cn(
                                            "flex w-full",
                                            isMe ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                                    : "bg-card border border-border/50 rounded-bl-md"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                                                {isBot && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                                        BOT
                                                    </Badge>
                                                )}
                                                <span className={cn(
                                                    "text-[10px]",
                                                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
                        <div className="max-w-3xl mx-auto flex items-end gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                disabled={selectedConversation.assignedTo === 'BOT'}
                            >
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <div className={cn(
                                "flex-1 rounded-xl border border-border/50 bg-muted/30 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-200",
                                selectedConversation.assignedTo === 'BOT' && "opacity-50 cursor-not-allowed"
                            )}>
                                <textarea
                                    className="w-full bg-transparent border-none p-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px] disabled:cursor-not-allowed"
                                    placeholder={selectedConversation.assignedTo === 'BOT' ? "Join conversation to send messages" : "Type a message..."}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    disabled={selectedConversation.assignedTo === 'BOT'}
                                />
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                size="icon"
                                className={cn(
                                    "shrink-0 transition-all",
                                    input.trim() ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 w-0 px-0 overflow-hidden"
                                )}
                                disabled={selectedConversation.assignedTo === 'BOT'}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-center p-8">
                    <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Phone className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">WhatsApp Conversations</h2>
                    <p className="text-muted-foreground max-w-md">
                        Select a conversation to view messages and manage customer interactions.
                    </p>
                </div>
            )}

            {/* --- Right Sidebar: Contact Info --- */}
            {selectedConversation && (
                <div className="w-80 border-l border-border/50 bg-card/50 flex flex-col h-full hidden xl:flex">
                    <div className="h-full flex flex-col">
                        <div className="p-5 border-b border-border/50">
                            <h3 className="text-lg font-semibold">Contact Information</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Contact Details</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedConversation.customer?.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border/50" />

                            <div>
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Conversation Owner</h4>
                                <div className="flex items-center gap-2">
                                    {selectedConversation.assignedTo === 'BOT' ? (
                                        <>
                                            <Bot className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Assigned to AI bot</span>
                                        </>
                                    ) : (
                                        <>
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Assigned to Agent</span>
                                        </>
                                    )}
                                </div>
                                {selectedConversation.assignedTo === 'BOT' ? (
                                    <div className="mt-3">
                                        <Button
                                            onClick={() => handleAssignmentChange('AGENT')}
                                            className="w-full h-9 text-xs"
                                        >
                                            Join Conversation
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <Button
                                            onClick={() => handleAssignmentChange('BOT')}
                                            variant="outline"
                                            className="w-full h-9 text-xs"
                                        >
                                            Assign back to Bot
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-border/50" />

                            <div className="flex-1">
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Booking History</h4>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    <div className="p-3 border border-border/50 rounded-lg space-y-1 bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-medium">Court 2 - Padel</h5>
                                            <Badge variant="warning" className="text-xs">pending</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>Dec 9, 2025</span>
                                            <span>•</span>
                                            <span>20:00 - 21:00</span>
                                        </div>
                                        <div className="text-xs font-medium flex items-center gap-1">
                                            <span>SAR</span>
                                            <span>220.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
