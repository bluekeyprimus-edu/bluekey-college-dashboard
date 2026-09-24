import { Attachment, AttachmentEntityType } from "@/lib/types";
import { uploadAttachment, deleteAttachment } from "@/lib/actions";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function AttachmentsSection({
  studentId,
  entityType,
  entityId,
  attachments,
}: {
  studentId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  attachments: Attachment[];
}) {
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-navy-50/60 p-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">첨부파일</div>

      {attachments.length === 0 && <p className="text-xs text-navy-400">첨부된 파일이 없어요.</p>}

      {attachments.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5">
          <a
            href={a.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-medium text-gold-600 hover:text-gold-700"
          >
            {a.file_name}
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] text-navy-400">{formatFileSize(a.file_size)}</span>
            <form action={deleteAttachment.bind(null, studentId, entityType, a.id, a.storage_path)}>
              <button type="submit" className="text-[11px] font-medium text-rose-500 hover:text-rose-700">
                삭제
              </button>
            </form>
          </div>
        </div>
      ))}

      <form
        action={uploadAttachment.bind(null, studentId, entityType, entityId)}
        encType="multipart/form-data"
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="file"
          required
          className="flex-1 text-xs text-navy-600 file:mr-2 file:rounded-md file:border-0 file:bg-navy-900 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white file:hover:bg-navy-800"
        />
        <button type="submit" className="rounded-md border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50">
          업로드
        </button>
      </form>
    </div>
  );
}
