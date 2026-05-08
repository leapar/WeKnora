import { useTranslation } from 'react-i18next'
import type { DatabaseQueryData } from '@/types/tool-results'

interface DatabaseQueryProps {
  data: DatabaseQueryData
}

export function DatabaseQuery({ data }: DatabaseQueryProps) {
  const { t } = useTranslation()

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return t('chat.nullValuePlaceholder')
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className="database-query-display">
      {data.rows && data.rows.length > 0 ? (
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                {data.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr key={index}>
                  {data.columns.map((column) => (
                    <td key={column}>{formatValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">{t('chat.noDatabaseRecords')}</div>
      )}
    </div>
  )
}