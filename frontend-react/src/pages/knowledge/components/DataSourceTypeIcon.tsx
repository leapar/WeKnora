import feishuIcon from '@/assets/img/datasource-feishu.ico'
import notionIcon from '@/assets/img/datasource-notion.ico'
import yuqueIcon from '@/assets/img/datasource-yuque.ico'

interface DataSourceTypeIconProps {
  type: string
  size?: number
}

const iconMap: Record<string, string> = {
  feishu: feishuIcon,
  notion: notionIcon,
  yuque: yuqueIcon,
}

function fallbackText(type: string): string {
  switch (type) {
    case 'feishu':
      return 'F'
    case 'notion':
      return 'N'
    case 'yuque':
      return 'Y'
    default:
      return type.slice(0, 1).toUpperCase() || '?'
  }
}

export function DataSourceTypeIcon({ type, size = 20 }: DataSourceTypeIconProps) {
  return (
    <span
      className="ds-type-icon"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {iconMap[type] ? (
        <img
          src={iconMap[type]}
          alt={type}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <span className="ds-type-icon-fallback">{fallbackText(type)}</span>
      )}
    </span>
  )
}