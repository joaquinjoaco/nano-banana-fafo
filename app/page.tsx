"use client"

import { ImageUploadClient } from "@/components/image-upload-client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function Home() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleImageGenerated = (imageData: string) => {
    setGeneratedImage(`data:image/png;base64,${imageData}`)
  }

  const handleDownloadImage = () => {
    if (!generatedImage) return

    try {
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = `virtual-try-on-${Date.now()}.png`
      link.style.display = 'none'

      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback: open in new tab
      window.open(generatedImage, '_blank')
    }
  }
  return (
    <div className="h-screen bg-background">
      {/* Studio Frame - Full Screen */}
      <div className="h-full">
        {/* Black outer frame taking full screen */}
        <div className="bg-studio-outer h-full p-1 md:p-2">
          <div className="h-full flex flex-col md:flex-row gap-1 md:gap-2">
            {/* Left section - Image Upload */}
            <div className="flex-1">
              <ImageUploadClient onImageGenerated={handleImageGenerated} />
            </div>

            {/* Right section - the actual "canvas/result" area */}
            <div className="flex-1 bg-studio-inner rounded-xl flex items-center justify-center overflow-hidden relative">
              {generatedImage ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={generatedImage}
                    alt="Generated virtual try-on result"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                  {/* Download button overlay */}
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="link"
                      onClick={handleDownloadImage}
                      className="bg-black/50 hover:bg-black/70 text-white border border-white/20 cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/40 flex items-center justify-center">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg">Try it on</p>
                  <p className="text-sm mt-2">Podés probártelo, en serio.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
