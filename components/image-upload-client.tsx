"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
// Removed Card component imports

interface ImageUploadClientProps {
    onImageGenerated?: (imageData: string) => void
}

export function ImageUploadClient({ onImageGenerated }: ImageUploadClientProps = {}) {
    const [files, setFiles] = React.useState<File[]>([])
    const [previews, setPreviews] = React.useState<string[]>([])
    const [progress, setProgress] = React.useState(0)
    const [uploading, setUploading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [currentStep, setCurrentStep] = React.useState<1 | 2>(1) // Track current step

    const maxFiles = 2  // Limit to 2 files
    const maxSize = 10485760 // 10MB for images

    // Cleanup previews on unmount
    React.useEffect(() => {
        return () => {
            previews.forEach(preview => URL.revokeObjectURL(preview))
        }
    }, [previews])

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        setError(null)

        // Step 1: Accept only 1 file
        if (currentStep === 1) {
            if (acceptedFiles.length !== 1) {
                setError(`Selecciona solo 1 imagen para el primer paso.`)
                return
            }
            setFiles(acceptedFiles)
            const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
            setPreviews(newPreviews)
        }
        // Step 2: Accept only 1 file to add to existing
        else if (currentStep === 2) {
            if (acceptedFiles.length !== 1) {
                setError(`Selecciona solo 1 imagen para el segundo paso.`)
                return
            }
            if (files.length >= maxFiles) {
                setError(`Ya tienes el máximo de ${maxFiles} imágenes.`)
                return
            }
            const newFiles = [...files, ...acceptedFiles]
            setFiles(newFiles)
            const newPreviews = [...previews, ...acceptedFiles.map(file => URL.createObjectURL(file))]
            setPreviews(newPreviews)
        }
    }, [currentStep, files, previews, maxFiles])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']  // Accept all image formats
        },
        maxFiles: 1, // Accept only 1 file at a time
        maxSize,
    })

    const handleNextStep = () => {
        if (currentStep === 1 && files.length === 1) {
            setCurrentStep(2)
        }
    }

    const handleUpload = async () => {
        try {
            setUploading(true)
            setProgress(0)
            setError(null)

            // Create FormData with the two images
            const formData = new FormData()
            formData.append('modelImage', files[0]) // First image is the model
            formData.append('clothingImage', files[1]) // Second image is the clothing

            // Simple progress simulation
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) {
                        clearInterval(interval)
                        return prev
                    }
                    return prev + 5
                })
            }, 200)

            // Call the /api/upload endpoint
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to process images')
            }

            const result = await response.json()

            clearInterval(interval)
            setProgress(100)

            // Reset after successful upload
            setTimeout(() => {
                setFiles([])
                // Clean up all preview URLs to prevent memory leaks
                previews.forEach(preview => URL.revokeObjectURL(preview))
                setPreviews([])
                setProgress(0)
                setUploading(false)
                setCurrentStep(1) // Reset to step 1

                // Call the callback with the generated image
                if (onImageGenerated && result.image) {
                    onImageGenerated(result.image)
                }

                console.log('Virtual try-on completed by the tiny banana!', result)
            }, 1000)
        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Error procesando las imágenes')
            setUploading(false)
            setProgress(0)
        }
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        // Clean up the preview URL to prevent memory leaks
        setPreviews((prev) => {
            const newPreviews = prev.filter((_, i) => i !== index)
            // Revoke the object URL for the removed file
            URL.revokeObjectURL(prev[index])
            return newPreviews
        })
        setError(null)
    }

    return (
        <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">
                        {currentStep === 1 ? "Imagen del modelo" : "Imagen de la prenda"}
                    </h2>
                    <p className="text-muted-foreground">
                        <span className="hidden sm:inline">
                            {currentStep === 1
                                ? "Arrastra y suelta la imagen del modelo aquí o toca en el cuadro para seleccionar la imagen del modelo"
                                : "Arrastra y suelta la imagen de la prenda aquí o toca en el cuadro para seleccionar la imagen de la prenda"
                            }
                        </span>
                        <span className="inline sm:hidden">
                            {currentStep === 1
                                ? "Toca para seleccionar la imagen del modelo"
                                : "Toca para seleccionar la imagen de la prenda"
                            }
                        </span>
                        <br />
                        <span className="text-xs font-bold">
                            (Una sola imagen, hasta 10MB)
                        </span>
                    </p>
                </div>
                <div className="space-y-4">
                    {/* Show first image preview in step 2 (only when we have exactly 1 file) */}
                    {currentStep === 2 && files.length === 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Imagen seleccionada:</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentStep(1)
                                        // Clear all files and previews when going back
                                        setFiles([])
                                        previews.forEach(preview => URL.revokeObjectURL(preview))
                                        setPreviews([])
                                        setError(null)
                                    }}
                                >
                                    ← Volver atrás
                                </Button>
                            </div>
                            <div className="flex items-center space-x-3 p-2 border rounded bg-muted/20">
                                <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                                    <img
                                        src={previews[0]}
                                        alt={files[0].name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                                            Modelo
                                        </span>
                                        <span className="text-sm font-medium truncate max-w-[160px]">{files[0].name}</span>
                                    </div>
                                    <span className="mt-[2px] text-xs text-muted-foreground">
                                        {(files[0].size / 1024 / 1024).toFixed(1)}MB
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show dropzone when no files in step 1, or when we need the second file in step 2 */}
                    {((currentStep === 1 && files.length === 0) || (currentStep === 2 && files.length < 2)) && (
                        <div
                            {...getRootProps()}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted-foreground/10",
                                isDragActive ? "border-primary bg-muted-foreground/10" : "",
                                error && "border-destructive"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center space-y-2">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                {isDragActive
                                    ? "Suelta la imagen aquí"
                                    : `Arrastra la ${currentStep === 1 ? 'primera' : 'segunda'} imagen aquí o haz clic para seleccionarla`
                                }
                            </p>
                            <p className={`text-sm font-bold text-muted-foreground ${isDragActive ? "opacity-0" : ""}`}>
                                JPG, JPEG, PNG, WEBP (máx. 10MB)
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {/* Show file list when we have files and are not waiting for more files */}
                    {files.length > 0 && ((currentStep === 1) || (currentStep === 2 && files.length === 2)) && (
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={file.name}
                                    className="flex items-center justify-between p-2 border rounded"
                                >
                                    <div className="flex items-center space-x-3">
                                        {/* Image Preview */}
                                        <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                                            <img
                                                src={previews[index]}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                                                    {index === 0 ? "Modelo" : "Prenda"}
                                                </span>
                                                <span className="text-sm font-medium truncate max-w-[160px]">{file.name}</span>
                                            </div>
                                            <span className="mt-[2px] text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(1)}MB
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(index)}
                                        disabled={uploading || (files.length === 2 && index === 0)}
                                        title={files.length === 2 && index === 0 ? "No puedes eliminar la imagen del modelo. Usa 'Volver al paso 1' para cambiarla." : "Eliminar imagen"}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {progress > 0 && (
                        <Progress value={progress} className="h-2" />
                    )}

                    {/* Show appropriate button based on step and file count */}
                    {((currentStep === 1 && files.length === 1) || (currentStep === 2 && files.length === 2)) && (
                        <Button
                            onClick={currentStep === 1 ? handleNextStep : handleUpload}
                            disabled={uploading}
                            className="w-full"
                        >
                            {uploading
                                ? 'Generando...'
                                : currentStep === 1
                                    ? 'Continuar'
                                    : `Subir ${files.length} Imagen${files.length > 1 ? 'es' : ''}`
                            }
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
