'use client'

import { FileText, Download, ExternalLink } from 'lucide-react'
import { type RentalDocument } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DocumentViewerProps {
  documents: RentalDocument[]
  rentalId: string
}

export function DocumentViewer({ documents, rentalId }: DocumentViewerProps) {
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agreement: 'Rental Agreement',
      addendum: 'Addendum',
      termination: 'Termination Notice',
      insurance: 'Insurance Document',
    }
    return labels[type] || type
  }

  const handleDownload = async (document: RentalDocument) => {
    try {
      // In a real implementation, this would fetch the file from Supabase Storage
      // For now, we'll create a placeholder URL
      const url = `/api/rentals/${rentalId}/documents/${document.id}/download`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>No documents uploaded yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Rental agreement documents and attachments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{document.file_name}</p>
                    <Badge variant="secondary">{getDocumentTypeLabel(document.document_type)}</Badge>
                    {document.signed && (
                      <Badge variant="default" className="text-xs">
                        Signed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Version {document.version} • Uploaded{' '}
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `/api/rentals/${rentalId}/documents/${document.id}/view`
                    window.open(url, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
