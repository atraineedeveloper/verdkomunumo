const DEFAULT_MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.82

function getOutputMimeType(file: File) {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return null
  }

  return 'image/webp'
}

function getOutputName(file: File, mimeType: string) {
  const base = file.name.replace(/\.[^.]+$/, '') || 'image'
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg'
  return `${base}.${ext}`
}

async function loadBitmap(file: File) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file)
  }

  const url = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo leer la imagen'))
      img.src = url
    })

    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function getTargetSize(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.round((height / width) * maxDimension)
    }
  }

  return {
    width: Math.round((width / height) * maxDimension),
    height: maxDimension
  }
}

async function canvasToFile(canvas: HTMLCanvasElement, file: File, mimeType: string, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mimeType, quality)
  })

  if (!blob) return file

  return new File([blob], getOutputName(file, mimeType), {
    type: mimeType,
    lastModified: Date.now()
  })
}

export async function optimizeImageFile(
  file: File,
  options?: {
    maxDimension?: number
    quality?: number
  }
) {
  const mimeType = getOutputMimeType(file)
  if (!mimeType) return file

  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = options?.quality ?? DEFAULT_QUALITY

  try {
    const source = await loadBitmap(file)
    const width = 'naturalWidth' in source ? source.naturalWidth : source.width
    const height = 'naturalHeight' in source ? source.naturalHeight : source.height
    const size = getTargetSize(width, height, maxDimension)

    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(source, 0, 0, size.width, size.height)

    if ('close' in source && typeof source.close === 'function') {
      source.close()
    }

    const optimized = await canvasToFile(canvas, file, mimeType, quality)
    return optimized.size < file.size ? optimized : file
  } catch {
    return file
  }
}

export async function optimizeImageFiles(
  files: File[],
  options?: {
    maxDimension?: number
    quality?: number
  }
) {
  return Promise.all(files.map((file) => optimizeImageFile(file, options)))
}

export function replaceInputFiles(input: HTMLInputElement | null, files: File[]) {
  if (!input) return

  const transfer = new DataTransfer()
  for (const file of files) {
    transfer.items.add(file)
  }
  input.files = transfer.files
}
