import { useTranslation } from 'react-i18next'

export function UploadMask() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col justify-center items-center">
      <img
        className="w-40 h-40 mb-4"
        src="/assets/img/upload-mask.svg"
        alt=""
      />
      <span className="text-[var(--td-brand-color)] font-semibold text-2xl leading-7 my-3">
        {t('file.upload')}
      </span>
      <span className="w-[217px] text-center text-[var(--td-text-color-disabled)] text-xs">
        {t('knowledgeBase.pdfDocFormat')}
      </span>
      <span className="w-[217px] text-center text-[var(--td-text-color-disabled)] text-xs">
        {t('knowledgeBase.textMarkdownFormat')}
      </span>
    </div>
  )
}