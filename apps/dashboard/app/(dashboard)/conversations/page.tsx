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
import { cn } from "@/lib/utils";

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
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
    }, [selectedId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedId) return;

        // Optimistic update (optional, but good for UX)
        // For now, we'll just wait for the API (which isn't implemented for sending yet)
        console.log("Sending message:", input);
        setInput("");

        // TODO: Implement send message API
        // await api.post(`/conversations/${selectedId}/messages`, { content: input });
        // fetchMessages();
    };

    const handleAssignmentChange = async (newStatus: 'BOT' | 'AGENT') => {
        if (!selectedId) return;
        try {
            await api.patch(`/conversations/${selectedId}/assign`, { assignedTo: newStatus });
            // Update local state
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
            <div className="w-80 flex flex-col border-r bg-muted/10">
                <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
                    <h2 className="font-semibold mb-4 text-lg">Inbox</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." className="pl-9 bg-background" />
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
                                        "group flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0",
                                        selectedId === conv._id && "bg-muted"
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
                                                {conv.updatedAt ? format(new Date(conv.updatedAt), 'MMM d') : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                                                {conv.lastMessage?.content || "No messages"}
                                            </p>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
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
                <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                    {/* Background Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}
                    />

                    {/* Chat Header */}
                    <div className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur-sm z-10">
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
                                                "max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm relative group",
                                                isMe ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                {isBot && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-black/5 hover:bg-black/10 text-gray-500">
                                                        BOT
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] text-gray-500">
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
                    <div className="p-4 bg-background/95 backdrop-blur-sm border-t z-10">
                        <div className="max-w-3xl mx-auto flex items-end gap-2">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <div className="flex-1 bg-muted/20 rounded-lg border focus-within:ring-1 focus-within:ring-primary">
                                <textarea
                                    className="w-full bg-transparent border-none p-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
                                    placeholder="Type a message..."
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                size="icon"
                                className={cn(
                                    "shrink-0 transition-all",
                                    input.trim() ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 w-0 px-0 overflow-hidden"
                                )}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-center p-8 border-b-8 border-primary/40">
                    <div className="w-64 h-64 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Phone className="h-32 w-32 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-3xl font-light text-gray-800 mb-4">WhatsApp Web</h2>
                    <p className="text-gray-500 max-w-md">
                        Send and receive messages without keeping your phone online.
                        Use Yalla Reservation on up to 4 linked devices and 1 phone.
                    </p>
                </div>
            )}

            {/* --- Right Sidebar: Contact Info (Optional / Collapsible) --- */}
            {/* --- Right Sidebar: Contact Info --- */}
            {selectedConversation && (
                <div className="w-80 border-l bg-background flex flex-col h-full hidden xl:flex">
                    <div className="h-full flex flex-col">
                        <div className="p-5 border-b">
                            <h3 className="text-lg font-semibold">Contact Information</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Contact Details</h4>
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

                            <div data-orientation="horizontal" role="none" className="bg-border shrink-0 h-[1px] w-full"></div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Conversation Owner</h4>
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
                                            className="w-full h-8 text-xs"
                                        >
                                            Join Conversation
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <Button
                                            onClick={() => handleAssignmentChange('BOT')}
                                            variant="outline"
                                            className="w-full h-8 text-xs"
                                        >
                                            Assign back to Bot
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div data-orientation="horizontal" role="none" className="bg-border shrink-0 h-[1px] w-full"></div>

                            <div className="flex-1">
                                <h4 className="text-sm font-medium mb-2">Booking History</h4>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {/* Mock Data for Booking History - matching the HTML example */}
                                    <div className="p-3 border rounded-lg space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-medium">Court 2 - Padel</h5>
                                            <Badge variant="secondary" className="font-semibold text-xs">pending</Badge>
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
