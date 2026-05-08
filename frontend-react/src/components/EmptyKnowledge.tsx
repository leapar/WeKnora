import { useTranslation } from 'react-i18next'
import uploadSvg from '@/assets/img/upload.svg'

export function EmptyKnowledge() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <img className="w-[162px] h-[162px]" src={uploadSvg} alt="" />
      <span className="mt-3 mb-4 text-base font-semibold text-[var(--td-text-color-placeholder)]">
        {t('knowledgeBase.emptyKnowledgeDragDrop')}
      </span>
      <span className="text-xs text-[var(--td-text-color-disabled)] text-center w-[217px]">
        {t('knowledgeBase.pdfDocFormat')}
      </span>
      <span className="text-xs text-[var(--td-text-color-disabled)] text-center w-[217px]">
        {t('knowledgeBase.textMarkdownFormat')}
      </span>
    </div>
  )
}
