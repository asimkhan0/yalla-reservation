import { FastifyInstance } from 'fastify';
import { saveFile } from './uploads.service.js';

export async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/', {
        schema: {
            tags: ['uploads'],
            summary: 'Upload a file',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate] // Ensure only authenticated users can upload
    }, async (request, reply) => {
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ message: 'No file uploaded' });
        }

        try {
            const url = await saveFile(data);
            // Construct full URL if needed, but relative path is often enough for frontend if proxying
            // Or return full URL based on server host. For now, returning path.

            // To make it a full URL:
            const protocol = request.protocol;
            const host = request.headers.host;
            const fullUrl = `${protocol}://${host}${url}`;

            return { url: fullUrl };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: 'File upload failed' });
        }
    });
}
