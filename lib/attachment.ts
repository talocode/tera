export type AttachmentType = 'file' | 'image'

export type AttachmentReference = {
  url: string
  name: string
  type: AttachmentType
  size?: number
}
