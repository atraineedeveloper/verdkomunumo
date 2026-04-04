import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RichText } from '@/components/RichText'
import { shouldShowReadMore } from '@/lib/postExcerpt'

type PostExcerptProps = {
  content: string
  to: string
  contentClassName: string
  linkClassName: string
  maxLines?: number
  maxChars?: number
}

export function PostExcerpt({
  content,
  to,
  contentClassName,
  linkClassName,
  maxLines,
  maxChars,
}: PostExcerptProps) {
  const { t } = useTranslation()
  const hasReadMore = shouldShowReadMore(content, { maxLines, maxChars })

  return (
    <div>
      <p className={contentClassName}>
        <RichText content={content} />
      </p>
      {hasReadMore && (
        <Link to={to} className={linkClassName}>
          {t('post_read_more')}
        </Link>
      )}
    </div>
  )
}
