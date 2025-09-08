import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'gemini-2.5-flash-image-preview'

export async function POST(request: NextRequest) {
    try {
        // Get the API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY environment variable not set' },
                { status: 500 }
            )
        }

        // Parse the multipart form data
        const formData = await request.formData()
        const modelImage = formData.get('modelImage') as File
        const clothingImage = formData.get('clothingImage') as File

        if (!modelImage || !clothingImage) {
            return NextResponse.json(
                { error: 'Both modelImage and clothingImage are required' },
                { status: 400 }
            )
        }

        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: MODEL_NAME })

        // Convert files to base64 for the API
        const modelImageBase64 = await fileToBase64(modelImage)
        const clothingImageBase64 = await fileToBase64(clothingImage)

        // Create the prompt for combining the images
        const prompt = `Take the clothing item from the second image and realistically place it on the person in the first image.
    Make it look natural and professional, as if the person is actually wearing that clothing item.
    Ensure proper lighting, shadows, and realistic integration with the person's body and pose.`

        // Prepare the content for the API
        const imageParts = [
            {
                inlineData: {
                    data: modelImageBase64,
                    mimeType: modelImage.type
                }
            },
            {
                inlineData: {
                    data: clothingImageBase64,
                    mimeType: clothingImage.type
                }
            }
        ]

        // Generate the combined image
        const result = await model.generateContent([
            ...imageParts,
            { text: prompt }
        ])

        const response = await result.response
        const generatedImage = response.candidates?.[0]?.content?.parts?.[0]

        if (!generatedImage || !generatedImage.inlineData) {
            return NextResponse.json(
                { error: 'Failed to generate image' },
                { status: 500 }
            )
        }

        // Return the generated image as base64
        return NextResponse.json({
            success: true,
            image: generatedImage.inlineData.data,
            mimeType: generatedImage.inlineData.mimeType
        })

    } catch (error) {
        console.error('Error processing upload:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    return buffer.toString('base64')
}
