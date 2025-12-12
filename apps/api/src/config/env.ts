import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file manually to ensure it's available before validation
// resolving from CWD (which should be apps/api or root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment variables schema
const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3001'),
    HOST: z.string().default('0.0.0.0'),

    // Database (MongoDB)
    MONGODB_URI: z.string().default('mongodb://localhost:27017/yalla_reservation'),

    // Redis
    REDIS_URL: z.string().optional(),

    // Authentication
    JWT_SECRET: z.string().min(32).default('your-super-secret-jwt-key-change-me-in-production-32chars'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_WHATSAPP_NUMBER: z.string().optional(),

    // OpenAI
    OPENAI_API_KEY: z.string().optional(),

    // Deepseek
    DEEPSEEK_API_KEY: z.string().optional(),

    // LLM Configuration
    LLM_PROVIDER: z.enum(['openai', 'deepseek']).default('deepseek'),
    LLM_MODEL: z.string().default('deepseek-chat'),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Parse and validate environment
const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables');
    }

    return parsed.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
