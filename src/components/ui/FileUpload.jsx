import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabase'

const FileUpload = ({ 
  onFilesUploaded, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  disabled = false,
  expenseId = null
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = expenseId ? `${expenseId}/${fileName}` : `temp/${fileName}`

      // Calculate file hash for integrity
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('expense-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('expense-attachments')
        .getPublicUrl(filePath)

      const fileInfo = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        url: urlData.publicUrl,
        hash: fileHash,
        uploaded: true
      }

      return fileInfo
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (disabled) return

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => ({
        file: file.name,
        errors: errors.map(e => e.message)
      }))
      console.error('File upload errors:', errors)
      return
    }

    setUploading(true)
    const newUploadedFiles = []

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        try {
          const fileInfo = await uploadFile(file)
          newUploadedFiles.push(fileInfo)
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
        }
      }

      setUploadedFiles(prev => [...prev, ...newUploadedFiles])
      onFilesUploaded?.(newUploadedFiles)
    } finally {
      setUploading(false)
      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 2000)
    }
  }, [disabled, expenseId, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: disabled || uploading
  })

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          {uploading ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Uploading files...
            </p>
          ) : isDragActive ? (
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Drop the files here...
            </p>
          ) : (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Drag & drop files here, or click to select
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Images, PDF, DOC files up to {formatFileSize(maxSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex-1 truncate">
                {fileName}
              </span>
              {progress === -1 ? (
                <span className="text-xs text-red-600">Failed</span>
              ) : progress === 100 ? (
                <span className="text-xs text-green-600">✓ Complete</span>
              ) : (
                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-slate-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={disabled}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload