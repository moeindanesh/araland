"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, Spinner, Tabs } from "@heroui/react";
import {
  Site,
  SiteForm,
  FormField,
  Lead,
  Member,
  Post,
  Domain,
  SiteFile,
} from "@araland/shared";
import {
  Plus,
  Trash2,
  Download,
  ArrowUpLeft,
  Users,
  Mail,
  FileText,
  Upload,
  Copy,
  Globe2,
  Sparkles,
  Check,
  RefreshCw,
  ExternalLink,
  Search,
  Pencil,
  X,
} from "lucide-react";
import {
  ActionButton,
  Button,
  CheckboxField,
  Empty,
  Input,
  Modal,
  Notice,
  SectionHeading,
  SelectField,
  TextArea,
} from "./ui";
import { request, json, fa, date, getToken, baseUrl } from "@/lib/client";
export function ManagementPanel({
  view,
  site,
  demo,
  onUpdate,
  onDirtyChange,
}: {
  view: string;
  site: Site;
  demo: boolean;
  onUpdate: (site: Site) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const titles: Record<string, [string, string]> = {
    leads: [
      "آدم‌ها، شروع هر رابطه خوب",
      "پاسخ فرم‌ها و اعضای سایتت را در یک جا ببین.",
    ],
    forms: [
      "یک گفتگو، از یک فرم شروع می‌شود",
      "فرم دلخواهت را بساز و مسیر ارتباط را کوتاه کن.",
    ],
    files: [
      "یک فضای خصوصی برای هر مشتری",
      "فایل را برای یک شماره موبایل مشخص ارسال کن؛ فقط همان مخاطب می‌تواند آن را ببیند.",
    ],
    posts: [
      "داستانت را روایت کن",
      "نوشته‌هایی که دیده می‌شوند و به کسب‌وکارت اعتبار می‌دهند.",
    ],
    domains: [
      "یک آدرس، فقط برای تو",
      "دامنه دلخواهت را به خانه دیجیتال کسب‌وکارت متصل کن.",
    ],
    media: [
      "استودیو تصویر تو",
      "تصاویر تازه بساز، بهینه کن و در بخش‌های سایتت استفاده کن.",
    ],
    settings: [
      "جزئیات کوچک، تاثیر بزرگ",
      "نام، هویت بصری و نمایش سایتت در نتایج جستجو را تنظیم کن.",
    ],
  };
  const title = titles[view] || titles.settings;
  return (
    <>
      <SectionHeading title={title[0]} description={title[1]} />
      {demo ? (
        <div className="demo-feature">
          <div className="demo-feature-art">
            {view === "media" ? (
              <Sparkles size={50} />
            ) : view === "files" ? (
              <FileText size={50} />
            ) : view === "domains" ? (
              <Globe2 size={50} />
            ) : (
              <Users size={50} />
            )}
          </div>
          <Empty
            title="این بخش منتظر کسب‌وکار شماست"
            description="با شماره موبایلت وارد شو و سایت خودت را بساز تا اطلاعات واقعی‌ات اینجا نمایش داده شود."
          >
            <Link href="/login" className="btn">
              ورود و ساخت سایت <ArrowUpLeft size={18} />
            </Link>
          </Empty>
          <div className="feature-summary">
            {[
              "اطلاعات جداگانه برای هر سایت",
              "مدیریت از گوشی و مرورگر",
              "دسترسی امن به اطلاعات",
            ].map((t) => (
              <span key={t}>
                <Check size={15} />
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : view === "leads" ? (
        <LeadsPanel key={site.id} site={site} />
      ) : view === "forms" ? (
        <FormsPanel key={site.id} site={site} onDirtyChange={onDirtyChange} />
      ) : view === "files" ? (
        <FilesPanel key={site.id} site={site} />
      ) : view === "posts" ? (
        <PostsPanel key={site.id} site={site} onDirtyChange={onDirtyChange} />
      ) : view === "domains" ? (
        <DomainsPanel key={site.id} site={site} />
      ) : view === "media" ? (
        <MediaPanel key={site.id} site={site} />
      ) : (
        <SettingsPanel
          key={site.id}
          site={site}
          onUpdate={onUpdate}
          onDirtyChange={onDirtyChange}
        />
      )}
    </>
  );
}
function useLoad<T>(path: string, key: string) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const result = await request<Record<string, T[]>>(path);
      if (sequence.current === current) setData(result[key] || []);
    } catch (error) {
      if (sequence.current === current)
        setError(
          error instanceof Error ? error.message : "دریافت اطلاعات انجام نشد.",
        );
    } finally {
      if (sequence.current === current) setBusy(false);
    }
  }, [path, key]);
  useEffect(() => {
    setData([]);
    setError("");
    void reload();
    return () => {
      sequence.current += 1;
    };
  }, [reload]);
  return { data, error, busy, reload, setError };
}
function ListFeedback({
  list,
}: {
  list: { busy: boolean; error: string; reload: () => Promise<void> };
}) {
  if (list.busy)
    return (
      <div className="panel-loading" role="status">
        <Spinner size="sm" aria-hidden="true" />
        <span>در حال دریافت اطلاعات…</span>
      </div>
    );
  if (list.error)
    return (
      <div className="panel-load-error">
        <Notice message={list.error} error />
        <Button
          className="btn-outline btn-small"
          onClick={() => void list.reload()}
        >
          <RefreshCw size={15} />
          تلاش دوباره
        </Button>
      </div>
    );
  return null;
}
function DeleteResourceDialog({
  title,
  description,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal
      title="تایید حذف"
      onClose={() => {
        if (!busy) onCancel();
      }}
    >
      <div className="stack-form">
        <p>«{title}» حذف شود؟ این کار قابل بازگشت نیست.</p>
        {description && <p>{description}</p>}
        <Notice message={error} error />
        <div className="dialog-actions">
          <Button
            type="button"
            className="btn-outline"
            disabled={busy}
            onClick={onCancel}
            autoFocus
          >
            انصراف
          </Button>
          <Button
            type="button"
            className="btn-danger"
            loading={busy}
            onClick={() => void onConfirm()}
          >
            <Trash2 size={17} />
            حذف
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function usePendingChanges(
  dirty: boolean,
  onDirtyChange?: (dirty: boolean) => void,
) {
  const callback = useRef(onDirtyChange);
  useEffect(() => {
    callback.current = onDirtyChange;
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => callback.current?.(false), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
function DiscardChangesDialog({
  onKeepEditing,
  onDiscard,
}: {
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal title="تغییرات ذخیره نشده‌اند" onClose={onKeepEditing}>
      <div className="stack-form">
        <p>با بستن این پنجره، تغییرات ذخیره‌نشده از دست می‌روند.</p>
        <div className="dialog-actions">
          <Button
            type="button"
            className="btn-outline"
            onClick={onKeepEditing}
            autoFocus
          >
            ادامه ویرایش
          </Button>
          <Button type="button" className="btn-danger" onClick={onDiscard}>
            بستن بدون ذخیره
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .trim()
    .toLocaleLowerCase("fa");
}
function normalizeSearchPhone(value: string) {
  const normalized = normalizeSearch(value);
  if (!/^[+\d\s()-]+$/.test(normalized)) return "";
  return normalized
    .replace(/[\s()+-]/g, "")
    .replace(/^(?:0098|98)(?=9\d{9}$)/, "0");
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function LeadsPanel({ site }: { site: Site }) {
  const leads = useLoad<Lead>(`/sites/${site.id}/leads`, "leads");
  const commonLabels: Record<string, string> = {
    name: "نام و نام خانوادگی",
    phone: "شماره موبایل",
    email: "ایمیل",
    message: "پیام",
  };
  const members = useLoad<Member>(`/sites/${site.id}/members`, "members");
  const [tab, setTab] = useState("leads");
  const [query, setQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const memberSearch = normalizeSearch(memberQuery);
  const memberPhoneSearch = normalizeSearchPhone(memberQuery);
  const filteredMembers = members.data.filter(
    (member) =>
      normalizeSearch(`${member.name || ""} ${member.phone}`).includes(
        memberSearch,
      ) ||
      (!!memberPhoneSearch &&
        normalizeSearchPhone(member.phone).includes(memberPhoneSearch)),
  );
  const search = normalizeSearch(query);
  const phoneSearch = /^[+\d\s()-]+$/.test(search)
    ? normalizeSearchPhone(search)
    : "";
  const filtered = leads.data.filter((lead) => {
    const values = [lead.formTitle, ...Object.values(lead.values)];
    return (
      normalizeSearch(values.join(" ")).includes(search) ||
      (!!phoneSearch &&
        values.some((value) =>
          normalizeSearchPhone(value).includes(phoneSearch),
        ))
    );
  });
  function exportCsv() {
    const rows = [
      ["فرم", "تاریخ", "پاسخ"],
      ...filtered.map((l) => [
        l.formTitle,
        l.createdAt,
        Object.entries(l.values)
          .map(
            ([key, value]) =>
              `${l.fieldLabels?.[key] || commonLabels[key] || key}: ${value}`,
          )
          .join("\n"),
      ]),
    ];
    const csv =
      "\ufeff" +
      rows
        .map((r) =>
          r
            .map(
              (x) =>
                '"' +
                (String(x).match(/^[=+\-@\t\r]/) ? "'" : "") +
                String(x).replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${site.slug}-leads.csv`,
    );
  }
  return (
    <Card className="panel content-panel">
      <Tabs
        className="panel-tabs"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
      >
        <div className="panel-toolbar">
          <Tabs.ListContainer>
            <Tabs.List aria-label="مخاطبان سایت">
              <Tabs.Tab id="leads">
                پاسخ‌ها{" "}
                {!leads.busy && !leads.error && <b>{fa(leads.data.length)}</b>}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="members">
                اعضا{" "}
                {!members.busy && !members.error && (
                  <b>{fa(members.data.length)}</b>
                )}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          {tab === "leads" && (
            <Button
              className="btn-outline btn-small"
              onClick={exportCsv}
              disabled={leads.busy || !!leads.error || !filtered.length}
            >
              <Download size={15} />
              {search ? "CSV نتیجه‌های جستجو" : "دریافت CSV"}
            </Button>
          )}
          <ActionButton
            className="icon-btn"
            aria-label="تازه‌سازی مخاطبان"
            disabled={tab === "leads" ? leads.busy : members.busy}
            onClick={() =>
              void (tab === "leads" ? leads.reload() : members.reload())
            }
          >
            <RefreshCw size={17} />
          </ActionButton>
        </div>
        <Tabs.Panel id="leads">
          <ListFeedback list={leads} />
          {!leads.busy && !leads.error && (
            <>
              <div className="table-search">
                <Search size={17} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در پاسخ‌ها…"
                  aria-label="جستجو در پاسخ‌ها"
                />
                {query && (
                  <ActionButton
                    className="icon-btn"
                    aria-label="پاک کردن جستجوی پاسخ‌ها"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} />
                  </ActionButton>
                )}
              </div>
              {leads.data.length >= 1000 && (
                <p className="muted">
                  تا ۱۰۰۰ پاسخ آخر نمایش داده می‌شود. خروجی CSV شامل همین
                  پاسخ‌ها و فیلتر فعلی است.
                </p>
              )}
              {filtered.length ? (
                <div className="data-list">
                  {filtered.map((lead) => (
                    <article className="lead-row" key={lead.id}>
                      <span className="row-icon">
                        <Mail size={19} />
                      </span>
                      <div>
                        <h3>{lead.formTitle}</h3>
                        <dl>
                          {Object.entries(lead.values).map(([key, value]) => (
                            <div key={key}>
                              <dt>
                                {lead.fieldLabels?.[key] ||
                                  commonLabels[key] ||
                                  "پاسخ"}
                              </dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <time>{date(lead.createdAt)}</time>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title={
                    search ? "پاسخی با این عبارت پیدا نشد" : "هنوز پیامی نرسیده"
                  }
                  description={
                    search
                      ? "عبارت دیگری جستجو کن یا جستجو را پاک کن."
                      : "یک فرم بساز و سایتت را منتشر کن. پاسخ‌های مخاطبان اینجا ثبت می‌شوند."
                  }
                >
                  {search ? (
                    <Button
                      className="btn-outline btn-small"
                      onClick={() => setQuery("")}
                    >
                      نمایش همه پاسخ‌ها
                    </Button>
                  ) : (
                    <Link
                      href={`/editor/${site.id}`}
                      className="btn btn-outline btn-small"
                    >
                      باز کردن ویرایشگر سایت
                    </Link>
                  )}
                </Empty>
              )}
            </>
          )}
        </Tabs.Panel>
        <Tabs.Panel id="members">
          <ListFeedback list={members} />
          {!members.busy && !members.error && (
            <>
              <div className="table-search">
                <Search size={17} />
                <Input
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="جستجوی نام یا شماره موبایل…"
                  aria-label="جستجوی اعضا"
                />
                {memberQuery && (
                  <ActionButton
                    className="icon-btn"
                    aria-label="پاک کردن جستجوی اعضا"
                    onClick={() => setMemberQuery("")}
                  >
                    <X size={15} />
                  </ActionButton>
                )}
              </div>
              {members.data.length >= 1000 && (
                <p className="muted">تا ۱۰۰۰ عضو آخر نمایش داده می‌شود.</p>
              )}
            </>
          )}
          {!members.busy &&
            !members.error &&
            (filteredMembers.length ? (
              <div className="data-list">
                {filteredMembers.map((member) => (
                  <article className="lead-row" key={member.id}>
                    <span className="row-icon">
                      <Users size={19} />
                    </span>
                    <div>
                      <h3>{member.name || "عضو سایت"}</h3>
                      <p dir="ltr">{member.phone}</p>
                    </div>
                    <time>{date(member.createdAt)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title={
                  memberSearch
                    ? "عضوی با این نام یا شماره پیدا نشد"
                    : "اولین همراهت در راه است"
                }
                description={
                  memberSearch
                    ? "شماره یا نام دیگری جستجو کن."
                    : "مخاطبان با ورود به پنل سایت، عضو می‌شوند. ارسال فرم به‌تنهایی به معنی ثبت‌نام نیست."
                }
              />
            ))}
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
function FormsPanel({
  site,
  onDirtyChange,
}: {
  site: Site;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const list = useLoad<SiteForm>(`/sites/${site.id}/forms`, "forms");
  const visibleOnSite =
    !!site.publishedAt &&
    !!site.published?.sections.some(
      (section) => section.enabled && section.type === "contact",
    );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SiteForm | null>(null);
  const [removing, setRemoving] = useState<SiteForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [discard, setDiscard] = useState(false);
  usePendingChanges(open && hasChanges, onDirtyChange);
  function changeFields(next: FormField[]) {
    setFields(next);
    setHasChanges(true);
  }
  function closeEditor() {
    if (busy) return;
    if (hasChanges) setDiscard(true);
    else setOpen(false);
  }
  function openEditor(form?: SiteForm) {
    setHasChanges(false);
    setDiscard(false);
    setEditing(form || null);
    setFields(
      form
        ? form.fields.map((field) => ({
            ...field,
            options: field.options ? [...field.options] : undefined,
          }))
        : [
            {
              id: "name",
              label: "نام و نام خانوادگی",
              type: "text",
              required: true,
            },
            {
              id: "phone",
              label: "شماره موبایل",
              type: "phone",
              required: true,
            },
          ],
    );
    setError("");
    setMessage("");
    setOpen(true);
  }
  return (
    <>
      <div className="content-toolbar">
        <span>
          {list.busy || list.error
            ? "فرم‌های سایت"
            : `${fa(list.data.length)} فرم`}
        </span>
        <Button onClick={() => openEditor()} disabled={busy}>
          <Plus size={17} />
          ساخت فرم
        </Button>
      </div>
      <ListFeedback list={list} />
      <Notice message={message} />
      <p className="editor-hint">
        فرم‌ها مستقل از پیش‌نویس صفحه‌اند؛ ذخیره یا حذف فرم بلافاصله روی سایت
        منتشرشده اثر می‌گذارد. پرسش‌ها و پاسخ‌های قبلی محفوظ می‌مانند.
      </p>
      {!visibleOnSite && (
        <Link href={`/editor/${site.id}`} className="text-btn">
          برای نمایش فرم‌ها، بخش تماس را در ویرایشگر فعال و منتشر کن{" "}
          <ArrowUpLeft size={15} />
        </Link>
      )}
      {!list.busy &&
        !list.error &&
        (list.data.length ? (
          <div className="resource-grid">
            {list.data.map((form) => (
              <Card
                render={(props) => <article {...props} />}
                className="panel resource-card"
                key={form.id}
              >
                <span className="resource-icon">
                  <FileText size={25} />
                </span>
                <h3>{form.title}</h3>
                <p>
                  {fa(form.fields.length)} فیلد ·{" "}
                  {visibleOnSite
                    ? "در بخش تماس سایت نمایش داده می‌شود"
                    : "آماده نمایش در بخش تماس"}
                </p>
                <div className="field-chips">
                  {form.fields.map((f) => (
                    <span key={f.id}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </span>
                  ))}
                </div>
                <div className="resource-footer">
                  <Button
                    className="btn-outline btn-small"
                    onClick={() => openEditor(form)}
                    disabled={busy}
                  >
                    <Pencil size={15} />
                    ویرایش فرم
                  </Button>
                  <ActionButton
                    aria-label={`حذف ${form.title}`}
                    className="icon-btn danger"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setRemoving(form);
                    }}
                  >
                    <Trash2 size={17} />
                  </ActionButton>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="panel">
            <Empty
              title="گفتگو را تو شروع کن"
              description="فرم مشاوره، ثبت درخواست یا دریافت بازخورد بساز."
            >
              <Button onClick={() => openEditor()} disabled={busy}>
                <Plus size={17} />
                اولین فرم من
              </Button>
            </Empty>
          </Card>
        ))}
      {removing && (
        <DeleteResourceDialog
          title={removing.title}
          description="فرم از سایت فعال برداشته می‌شود؛ پاسخ‌های قبلی در بخش مخاطبان باقی می‌مانند."
          busy={busy}
          error={error}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await request(`/sites/${site.id}/forms/${removing.id}`, {
                method: "DELETE",
              });
              setRemoving(null);
              await list.reload();
              setMessage("فرم حذف شد.");
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {open && (
        <Modal
          title={editing ? "ویرایش فرم" : "فرم تازه"}
          onClose={closeEditor}
        >
          <form
            className="stack-form"
            key={editing?.id || "new-form"}
            onChangeCapture={() => setHasChanges(true)}
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const title = String(
                new FormData(e.currentTarget).get("title") || "",
              ).trim();
              const normalizedFields = fields.map((field) => ({
                ...field,
                label: field.label.trim(),
                options:
                  field.type === "select"
                    ? field.options
                        ?.map((option) => option.trim())
                        .filter(Boolean)
                    : undefined,
              }));
              setBusy(true);
              setError("");
              try {
                if (!title || normalizedFields.some((field) => !field.label))
                  throw new Error("نام فرم و عنوان همه فیلدها را وارد کنید.");
                if (
                  normalizedFields.some(
                    (field) =>
                      field.type === "select" && !field.options?.length,
                  )
                )
                  throw new Error(
                    "برای فیلد انتخابی، دست‌کم یک گزینه بنویسید.",
                  );
                if (
                  normalizedFields.some(
                    (field) =>
                      field.type === "select" &&
                      ((field.options?.length || 0) > 30 ||
                        field.options?.some((option) => option.length > 160)),
                  )
                )
                  throw new Error(
                    "هر فیلد انتخابی می‌تواند حداکثر ۳۰ گزینه داشته باشد؛ هر گزینه حداکثر ۱۶۰ حرف.",
                  );
                await request(
                  `/sites/${site.id}/forms${editing ? `/${editing.id}` : ""}`,
                  json(
                    {
                      title,
                      fields: normalizedFields,
                    },
                    editing ? "PATCH" : "POST",
                  ),
                );
                await list.reload();
                setHasChanges(false);
                setOpen(false);
                setMessage(editing ? "تغییرات فرم ذخیره شد." : "فرم ساخته شد.");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              نام فرم
              <Input
                name="title"
                required
                maxLength={160}
                defaultValue={editing?.title || ""}
                placeholder="درخواست مشاوره"
                disabled={busy}
              />
            </label>
            <div className="form-fields-editor">
              {fields.map((field, i) => (
                <div className="form-field-config" key={field.id}>
                  <Input
                    aria-label="عنوان فیلد"
                    required
                    maxLength={160}
                    value={field.label}
                    onChange={(e) =>
                      changeFields(
                        fields.map((f, j) =>
                          i === j ? { ...f, label: e.target.value } : f,
                        ),
                      )
                    }
                    disabled={busy}
                  />
                  <SelectField
                    aria-label="نوع فیلد"
                    value={field.type}
                    options={[
                      { value: "text", label: "متن کوتاه" },
                      { value: "phone", label: "موبایل" },
                      { value: "email", label: "ایمیل" },
                      { value: "textarea", label: "متن بلند" },
                      { value: "select", label: "انتخابی" },
                    ]}
                    onChange={(value) =>
                      changeFields(
                        fields.map((f, j) =>
                          i === j
                            ? {
                                ...f,
                                type: value as FormField["type"],
                              }
                            : f,
                        ),
                      )
                    }
                    disabled={busy}
                  />
                  <CheckboxField
                    checked={field.required}
                    onChange={(checked) =>
                      changeFields(
                        fields.map((f, j) =>
                          i === j ? { ...f, required: checked } : f,
                        ),
                      )
                    }
                    disabled={busy}
                  >
                    اجباری
                  </CheckboxField>
                  <ActionButton
                    type="button"
                    className="icon-btn danger"
                    aria-label="حذف فیلد"
                    onClick={() =>
                      changeFields(fields.filter((_, j) => i !== j))
                    }
                    disabled={busy}
                  >
                    <Trash2 size={16} />
                  </ActionButton>
                  {field.type === "select" && (
                    <Input
                      className="field-options-input"
                      placeholder="گزینه‌ها با ویرگول جدا شوند"
                      aria-label="گزینه‌ها"
                      required
                      value={field.options?.join(",") || ""}
                      onChange={(e) =>
                        changeFields(
                          fields.map((f, j) =>
                            i === j
                              ? {
                                  ...f,
                                  options: e.target.value.split(/[,،\n]/),
                                }
                              : f,
                          ),
                        )
                      }
                      disabled={busy}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="btn-outline"
              disabled={busy || fields.length >= 30}
              onClick={() =>
                changeFields([
                  ...fields,
                  {
                    id: `field_${crypto.randomUUID()}`,
                    label: "",
                    type: "text",
                    required: false,
                  },
                ])
              }
            >
              <Plus size={16} />
              افزودن فیلد
            </Button>
            <Notice message={error} error />
            <p className="editor-hint">
              ذخیره فرم به انتشار دوباره صفحه نیاز ندارد؛ روی سایت فعال اعمال
              می‌شود.
            </p>
            <Button loading={busy} disabled={busy || !fields.length}>
              ذخیره فرم <Check size={16} />
            </Button>
          </form>
        </Modal>
      )}
      {discard && (
        <DiscardChangesDialog
          onKeepEditing={() => setDiscard(false)}
          onDiscard={() => {
            setDiscard(false);
            setHasChanges(false);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
function FilesPanel({ site }: { site: Site }) {
  const list = useLoad<SiteFile>(`/sites/${site.id}/files`, "files");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SiteFile | null>(null);
  const [removeError, setRemoveError] = useState("");
  async function download(file: SiteFile) {
    if (downloading) return;
    setDownloading(file.id);
    setError("");
    try {
      const r = await fetch(`${baseUrl}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!r.ok) {
        const result = (await r.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          result?.error || "دریافت فایل انجام نشد. دوباره تلاش کن.",
        );
      }
      downloadBlob(await r.blob(), file.originalName);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading(null);
    }
  }
  return (
    <div className="two-columns">
      <Card
        render={(props) => <section {...props} />}
        className="panel content-panel"
      >
        <h3>تحویل امن فایل</h3>
        <p className="muted">
          گیرنده با شماره موبایلش در پنل سایت وارد می‌شود و فایل را دریافت
          می‌کند.
        </p>
        <p className="editor-hint">
          شماره گیرنده را بررسی کن. این عملیات فایل را در پنل او قرار می‌دهد و
          پیامک اطلاع‌رسانی ارسال نمی‌کند.
        </p>
        {!site.publishedAt && (
          <p className="editor-hint">
            می‌توانی فایل را آماده کنی؛ ورود مخاطب و دریافت آن پس از انتشار سایت
            ممکن می‌شود.
          </p>
        )}
        <form
          className="stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const form = e.currentTarget;
            const data = new FormData(form);
            const file = data.get("file");
            setBusy(true);
            setMessage("");
            setError("");
            try {
              const title = String(data.get("title") || "").trim();
              let phone = normalizeSearchPhone(
                String(data.get("recipientPhone") || ""),
              );
              if (/^9\d{9}$/.test(phone)) phone = `0${phone}`;
              if (!title) throw new Error("عنوان فایل را وارد کن.");
              if (!/^09\d{9}$/.test(phone))
                throw new Error(
                  "شماره موبایل معتبر ایران وارد کن؛ مثل ۰۹۱۲۱۲۳۴۵۶۷.",
                );
              if (!(file instanceof File) || !file.name)
                throw new Error("فایل موردنظر را انتخاب کن.");
              data.set("title", title);
              data.set("recipientPhone", `+98${phone.slice(1)}`);
              if (file instanceof File && file.size > 20 * 1024 * 1024)
                throw new Error("حجم فایل باید حداکثر ۲۰ مگابایت باشد.");
              await request(`/sites/${site.id}/files`, {
                method: "POST",
                body: data,
              });
              setMessage(
                site.publishedAt
                  ? "فایل در پنل اختصاصی گیرنده قرار گرفت؛ پیوند ورود را با او به اشتراک بگذار."
                  : "فایل ذخیره شد؛ پس از انتشار سایت، گیرنده می‌تواند وارد پنل شود و آن را ببیند.",
              );
              form.reset();
              await list.reload();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            عنوان فایل
            <Input
              name="title"
              required
              maxLength={160}
              placeholder="برنامه اختصاصی / قرارداد / فایل دوره"
              disabled={busy}
            />
          </label>
          <label>
            شماره موبایل گیرنده
            <Input
              name="recipientPhone"
              type="tel"
              dir="ltr"
              placeholder="09121234567"
              required
              maxLength={30}
              autoComplete="tel"
              disabled={busy}
            />
          </label>
          <label className="upload-field">
            <Upload size={24} />
            <b>فایل موردنظر را انتخاب کن</b>
            <span>حداکثر ۲۰ مگابایت</span>
            <input type="file" name="file" required disabled={busy} />
          </label>
          <Button loading={busy} disabled={busy}>
            ارسال به پنل مخاطب <ArrowUpLeft size={17} />
          </Button>
          <Notice message={message} />
          <Notice message={error} error />
        </form>
        {site.publishedAt && (
          <ActionButton
            className="text-btn"
            onClick={async () => {
              setError("");
              try {
                await navigator.clipboard.writeText(
                  new URL(`/portal/${site.slug}`, location.origin).href,
                );
                setMessage(
                  "پیوند ورود کپی شد. آن را برای گیرنده بفرست تا با شماره خودش وارد شود.",
                );
              } catch {
                setError(
                  "کپی خودکار انجام نشد. صفحه ورود مخاطبان را باز کن و آدرس آن را کپی کن.",
                );
              }
            }}
          >
            <Copy size={15} />
            کپی پیوند ورود مخاطب
          </ActionButton>
        )}
        {site.publishedAt ? (
          <Link
            href={`/portal/${site.slug}`}
            className="text-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            مشاهده صفحه ورود مخاطبان <ExternalLink size={15} />
          </Link>
        ) : (
          <Link href={`/editor/${site.id}`} className="text-btn">
            رفتن به ویرایشگر و انتشار سایت <ArrowUpLeft size={15} />
          </Link>
        )}
      </Card>
      <Card
        render={(props) => <section {...props} />}
        className="panel content-panel"
      >
        <h3>
          فایل‌های ارسال‌شده{" "}
          {!list.busy && !list.error && (
            <span className="count-badge">{fa(list.data.length)}</span>
          )}
        </h3>
        <ListFeedback list={list} />
        {!list.busy &&
          !list.error &&
          (list.data.length ? (
            list.data.map((file) => (
              <div className="file-row" key={file.id}>
                <span className="row-icon">
                  <FileText size={19} />
                </span>
                <div>
                  <b>{file.title}</b>
                  <small dir="ltr">
                    {file.recipientPhone} · {fa(Math.ceil(file.size / 1024))} KB
                  </small>
                </div>
                <ActionButton
                  aria-label={`دریافت ${file.title}`}
                  className="icon-btn"
                  disabled={!!downloading}
                  aria-busy={downloading === file.id}
                  onClick={() => download(file)}
                >
                  {downloading === file.id ? (
                    <Spinner size="sm" aria-label="در حال دریافت فایل" />
                  ) : (
                    <Download size={18} />
                  )}
                </ActionButton>
                <ActionButton
                  aria-label={`حذف و لغو دسترسی ${file.title}`}
                  className="icon-btn danger-text"
                  disabled={busy || !!downloading}
                  onClick={() => { setRemoveError(""); setRemoving(file); }}
                ><Trash2 size={18} /></ActionButton>
              </div>
            ))
          ) : (
            <Empty
              title="فایل‌ها اینجا می‌مانند"
              description="اولین فایل را برای یک مخاطب بارگذاری کنید."
            />
          ))}
      </Card>
      {removing && <DeleteResourceDialog
        title={removing.title}
        description="دسترسی گیرنده به این فایل فوراً لغو می‌شود. نسخه‌ای که قبلاً دانلود شده قابل پس‌گرفتن نیست."
        busy={busy}
        error={removeError}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (busy) return;
          setBusy(true); setRemoveError("");
          try {
            await request(`/sites/${site.id}/files/${removing.id}`, { method: "DELETE" });
            setRemoving(null);
            setMessage("فایل حذف و دسترسی به آن لغو شد.");
            await list.reload();
          } catch (error) { setRemoveError((error as Error).message); }
          finally { setBusy(false); }
        }}
      />}
    </div>
  );
}
function PostsPanel({
  site,
  onDirtyChange,
}: {
  site: Site;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const list = useLoad<Post>(`/sites/${site.id}/posts`, "posts");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [removing, setRemoving] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [discard, setDiscard] = useState(false);
  usePendingChanges(open && hasChanges, onDirtyChange);
  function openEditor(post?: Post) {
    setHasChanges(false);
    setDiscard(false);
    setEditing(post || null);
    setError("");
    setMessage("");
    setOpen(true);
  }
  async function togglePublished(post: Post) {
    if (busy) return;
    setBusy(true);
    setPublishing(post.id);
    setMessage("");
    setActionError("");
    try {
      await request(
        `/sites/${site.id}/posts/${post.id}`,
        json({ published: !post.published }, "PATCH"),
      );
      await list.reload();
      setMessage(
        post.published
          ? "نوشته به پیش‌نویس برگشت و از سایت عمومی برداشته شد."
          : site.publishedAt
            ? "نوشته در سایت منتشر شد."
            : "نوشته آماده نمایش است؛ ابتدا سایت را از ویرایشگر منتشر کن.",
      );
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setPublishing(null);
      setBusy(false);
    }
  }
  return (
    <>
      <div className="content-toolbar">
        <span>
          {list.busy || list.error
            ? "نوشته‌های سایت"
            : `${fa(list.data.length)} نوشته`}
        </span>
        <Button onClick={() => openEditor()} disabled={busy}>
          <Plus size={17} />
          نوشته تازه
        </Button>
      </div>
      <ListFeedback list={list} />
      <Notice message={message} />
      <Notice message={actionError} error />
      <p className="editor-hint">
        وضعیت انتشار هر نوشته مستقل است. ویرایش نوشته منتشرشده فوراً روی سایت
        دیده می‌شود؛ برای آماده‌سازی خصوصی، تیک انتشار را بردار.
      </p>
      {(!site.publishedAt ||
        !site.published?.sections.some(
          (section) => section.enabled && section.type === "blog",
        )) && (
        <p className="editor-hint">
          برای نمایش فهرست نوشته‌ها در صفحه اصلی، بخش بلاگ را از ویرایشگر فعال و
          سایت را منتشر کن.
        </p>
      )}
      {!list.busy &&
        !list.error &&
        (list.data.length ? (
          <div className="resource-grid">
            {list.data.map((post) => (
              <Card
                render={(props) => <article {...props} />}
                className="panel post-card"
                key={post.id}
              >
                {post.cover && <img src={post.cover} alt={post.title} />}
                <div>
                  <span
                    className={`status-label ${post.published ? "published" : ""}`}
                  >
                    {post.published
                      ? site.publishedAt
                        ? "منتشر شده"
                        : "آماده انتشار سایت"
                      : "پیش‌نویس"}
                  </span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="resource-footer">
                    <Button
                      className="btn-outline btn-small"
                      disabled={busy}
                      onClick={() => openEditor(post)}
                    >
                      <Pencil size={15} />
                      ویرایش
                    </Button>
                    <Button
                      className="btn-outline btn-small"
                      disabled={busy}
                      onClick={() => void togglePublished(post)}
                      loading={publishing === post.id}
                    >
                      {post.published ? "بازگشت به پیش‌نویس" : "انتشار نوشته"}
                    </Button>
                  </div>
                  {post.published && site.publishedAt && (
                    <Link
                      href={`/s/${site.slug}/blog/${post.slug}`}
                      className="text-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      مشاهده نوشته <ExternalLink size={14} />
                    </Link>
                  )}
                  <footer>
                    <span>{date(post.createdAt)}</span>
                    <ActionButton
                      aria-label={`حذف ${post.title}`}
                      className="icon-btn danger"
                      disabled={busy}
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setRemoving(post);
                      }}
                    >
                      <Trash2 size={17} />
                    </ActionButton>
                  </footer>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="panel">
            <Empty
              title="اولین داستانت را بنویس"
              description="دانسته‌ها، تجربه‌ها و خبرهای کسب‌وکارت را با مخاطبان به اشتراک بگذار."
            />
          </Card>
        ))}
      {removing && (
        <DeleteResourceDialog
          title={removing.title}
          description={
            removing.published
              ? "نوشته و نشانی آن بلافاصله از دسترس مخاطبان خارج می‌شوند."
              : "پیش‌نویس این نوشته حذف خواهد شد."
          }
          busy={busy}
          error={error}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await request(`/sites/${site.id}/posts/${removing.id}`, {
                method: "DELETE",
              });
              setRemoving(null);
              await list.reload();
              setMessage("نوشته حذف شد.");
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {open && (
        <Modal
          title={editing ? "ویرایش نوشته" : "یک نوشته تازه"}
          onClose={() => {
            if (busy) return;
            if (hasChanges) setDiscard(true);
            else setOpen(false);
          }}
        >
          <form
            className="stack-form"
            key={editing?.id || "new-post"}
            onChangeCapture={() => setHasChanges(true)}
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const data = new FormData(e.currentTarget);
              const cover = String(data.get("cover") || "").trim();
              const payload = {
                title: String(data.get("title") || "").trim(),
                slug: String(data.get("slug") || "").trim(),
                excerpt: String(data.get("excerpt") || ""),
                body: String(data.get("body") || ""),
                published: data.has("published"),
                ...(cover ? { cover } : editing ? { cover: null } : {}),
              };
              setBusy(true);
              setError("");
              try {
                if (!payload.title || !payload.body.trim())
                  throw new Error("عنوان و متن نوشته را وارد کن.");
                await request(
                  `/sites/${site.id}/posts${editing ? `/${editing.id}` : ""}`,
                  json(payload, editing ? "PATCH" : "POST"),
                );
                await list.reload();
                setHasChanges(false);
                setOpen(false);
                setMessage(
                  payload.published
                    ? site.publishedAt
                      ? "نوشته ذخیره شد و در سایت نمایش داده می‌شود."
                      : "نوشته ذخیره شد؛ برای نمایش آن، سایت را از ویرایشگر منتشر کن."
                    : "پیش‌نویس نوشته ذخیره شد و برای مخاطبان قابل مشاهده نیست.",
                );
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              عنوان
              <Input
                name="title"
                required
                maxLength={160}
                defaultValue={editing?.title || ""}
                disabled={busy}
              />
            </label>
            <label>
              آدرس نوشته
              <Input
                name="slug"
                required
                dir="ltr"
                pattern="[a-zA-Z0-9\u0600-\u06FF]+(?:-[a-zA-Z0-9\u0600-\u06FF]+)*"
                maxLength={150}
                defaultValue={editing?.slug || ""}
                placeholder="my-first-story"
                aria-describedby="post-slug-help"
                disabled={busy}
              />
              <small id="post-slug-help">
                حروف فارسی یا انگلیسی، عدد و خط تیره؛ مثل «راهنمای-شروع». تغییر
                آدرس، پیوند قبلی نوشته را غیرفعال می‌کند.
              </small>
            </label>
            <label>
              خلاصه
              <TextArea
                name="excerpt"
                rows={2}
                maxLength={1000}
                defaultValue={editing?.excerpt || ""}
                disabled={busy}
              />
            </label>
            <label>
              متن نوشته
              <TextArea
                name="body"
                required
                rows={8}
                maxLength={100000}
                defaultValue={editing?.body || ""}
                disabled={busy}
              />
            </label>
            <label>
              نشانی تصویر جلد
              <Input
                name="cover"
                type="url"
                dir="ltr"
                placeholder="https://…"
                defaultValue={editing?.cover || ""}
                maxLength={2048}
                disabled={busy}
              />
            </label>
            <CheckboxField
              name="published"
              defaultChecked={editing?.published || false}
              disabled={busy}
              onChange={() => setHasChanges(true)}
            >
              {site.publishedAt
                ? "نمایش نوشته در سایت منتشرشده"
                : "نمایش نوشته پس از انتشار سایت"}
            </CheckboxField>
            <Notice message={error} error />
            <p className="editor-hint">
              نوشته‌ای که تیک انتشار دارد با ذخیره روی سایت فعال نمایش داده
              می‌شود؛ پیش‌نویس بدون این تیک خصوصی می‌ماند.
            </p>
            <Button loading={busy} disabled={busy}>
              ذخیره نوشته <Check size={17} />
            </Button>
          </form>
        </Modal>
      )}
      {discard && (
        <DiscardChangesDialog
          onKeepEditing={() => setDiscard(false)}
          onDiscard={() => {
            setDiscard(false);
            setHasChanges(false);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
function DomainsPanel({ site }: { site: Site }) {
  const list = useLoad<Domain>(`/sites/${site.id}/domains`, "domains");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Domain | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [recordMessage, setRecordMessage] = useState<{
    id: string;
    text: string;
    error?: boolean;
  } | null>(null);
  return (
    <div className="two-columns">
      <Card
        render={(props) => <section {...props} />}
        className="panel content-panel"
      >
        <div className="resource-icon">
          <Globe2 size={28} />
        </div>
        <h3>دامنه کسب‌وکار شما</h3>
        <p className="muted">
          دامنه‌ای که مالک آن هستی وارد کن. در قدم بعد، با یک رکورد DNS مالکیتش
          را تایید می‌کنیم.
        </p>
        <form
          className="stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const form = e.currentTarget;
            const hostname = String(new FormData(form).get("hostname") || "")
              .trim()
              .toLowerCase();
            setBusy(true);
            setMessage("");
            setError("");
            try {
              await request(`/sites/${site.id}/domains`, json({ hostname }));
              form.reset();
              await list.reload();
              setMessage("دامنه ثبت شد. رکورد TXT را در پنل دامنه اضافه کنید.");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            نام دامنه
            <Input
              name="hostname"
              placeholder="yourbusiness.ir"
              required
              dir="ltr"
              pattern={"[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}"}
              maxLength={253}
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="domain-host-help"
              disabled={busy}
            />
            <small id="domain-host-help">
              فقط نام دامنه یا زیردامنه، بدون https:// و مسیر؛ مثل
              shop.example.ir.
            </small>
          </label>
          <Button loading={busy && !verifying} disabled={busy}>
            <Plus size={17} />
            افزودن دامنه
          </Button>
          <Notice message={message} />
          <Notice message={error} error />
        </form>
        <div className="domain-note">
          <b>مسیر اتصال دامنه</b>
          <ol>
            <li>افزودن دامنه و تایید مالکیت TXT</li>
            <li>تنظیم A یا CNAME روی سرور استقرار</li>
            <li>فعال‌سازی گواهی HTTPS در سرور</li>
          </ol>
          <small>
            تایید DNS به‌تنهایی به معنی فعال‌شدن دامنه یا HTTPS نیست.
          </small>
        </div>
      </Card>
      <Card
        render={(props) => <section {...props} />}
        className="panel content-panel"
      >
        <h3>دامنه‌های ثبت‌شده</h3>
        <ListFeedback list={list} />
        {!list.busy &&
          !list.error &&
          (list.data.length ? (
            list.data.map((domain) => (
              <div className="domain-card" key={domain.id}>
                <div>
                  <b dir="ltr">{domain.hostname}</b>
                  <span
                    className={`status-label ${domain.status === "VERIFIED" ? "published" : ""}`}
                  >
                    {domain.status === "VERIFIED"
                      ? "مالکیت تایید شده"
                      : "منتظر تایید"}
                  </span>
                </div>
                <p>
                  {domain.status === "VERIFIED"
                    ? "مالکیت تایید شده؛ اتصال آدرس و HTTPS را در سرور استقرار تکمیل کن. رکورد تایید:"
                    : "رکورد TXT را در پنل DNS دامنه بساز:"}
                </p>
                <label>
                  نام رکورد<code dir="ltr">_araland.{domain.hostname}</code>
                </label>
                <label>
                  مقدار رکورد
                  <div className="copy-code">
                    <code dir="ltr">{`araland-verification=${domain.verificationToken}`}</code>
                    <ActionButton
                      className="icon-btn"
                      aria-label="کپی مقدار TXT"
                      onClick={async () => {
                        setRecordMessage(null);
                        try {
                          await navigator.clipboard.writeText(
                            `araland-verification=${domain.verificationToken}`,
                          );
                          setRecordMessage({
                            id: domain.id,
                            text: "مقدار رکورد کپی شد.",
                          });
                        } catch {
                          setRecordMessage({
                            id: domain.id,
                            error: true,
                            text: "کپی خودکار انجام نشد. مقدار رکورد را انتخاب و کپی کن.",
                          });
                        }
                      }}
                      disabled={busy}
                    >
                      <Copy size={15} />
                    </ActionButton>
                  </div>
                </label>
                <Button
                  className="btn-outline btn-small"
                  loading={verifying === domain.id}
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    setVerifying(domain.id);
                    setRecordMessage(null);
                    try {
                      const data = await request<{ domain: Domain }>(
                        `/sites/${site.id}/domains/${domain.id}/verify`,
                        json({}),
                      );
                      setRecordMessage({
                        id: domain.id,
                        text:
                          data.domain.status === "VERIFIED"
                            ? "مالکیت دامنه تایید شد؛ اکنون اتصال سرور و HTTPS را تکمیل کن."
                            : "رکورد هنوز قابل مشاهده نیست. انتشار DNS ممکن است زمان ببرد؛ نام و مقدار رکورد را بررسی و بعداً دوباره تلاش کن.",
                      });
                      await list.reload();
                    } catch (err) {
                      setRecordMessage({
                        id: domain.id,
                        text: (err as Error).message,
                        error: true,
                      });
                    } finally {
                      setVerifying(null);
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                >
                  <RefreshCw size={15} />
                  بررسی رکورد
                </Button>
                <ActionButton className="text-btn danger-text" disabled={busy} onClick={() => { setRemoveError(""); setRemoving(domain); }}>
                  <Trash2 size={15} /> حذف دامنه {domain.hostname}
                </ActionButton>
                {recordMessage?.id === domain.id && (
                  <Notice
                    message={recordMessage.text}
                    error={recordMessage.error}
                  />
                )}
              </div>
            ))
          ) : (
            <Empty
              title="آدرس اختصاصی‌ات را اضافه کن"
              description="می‌توانی قبل از اتصال دامنه هم سایت را با آدرس پیش‌فرض منتشر کنی."
            />
          ))}
      </Card>
      {removing && <DeleteResourceDialog
        title={removing.hostname}
        description="اتصال این دامنه به سایت حذف می‌شود؛ آدرس پیش‌فرض سایت باقی می‌ماند. رکوردهای DNS در پنل دامنه جداگانه مدیریت می‌شوند."
        busy={busy}
        error={removeError}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (busy) return;
          setBusy(true); setRemoveError("");
          try {
            await request(`/sites/${site.id}/domains/${removing.id}`, { method: "DELETE" });
            setRemoving(null); setRecordMessage(null);
            setMessage("دامنه از این سایت حذف شد.");
            await list.reload();
          } catch (error) { setRemoveError((error as Error).message); }
          finally { setBusy(false); }
        }}
      />}
    </div>
  );
}
function MediaPanel({ site }: { site: Site }) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [operation, setOperation] = useState<"generate" | "upload" | null>(
    null,
  );
  const list = useLoad<{ id: string; url: string; prompt?: string }>(
    `/sites/${site.id}/media`,
    "media",
  );
  return (
    <>
      <Card className="ai-panel">
        <div className="ai-star">✳</div>
        <span className="eyebrow">کمی خیال، یک تصویر تازه</span>
        <h2>
          تصویری که توی ذهنته،
          <br />
          به سایتت بیار.
        </h2>
        <p>صحنه، نور، رنگ و حس تصویر را توصیف کن.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const requestedPrompt = prompt.trim();
            setBusy(true);
            setOperation("generate");
            setError("");
            setMessage("");
            try {
              if (requestedPrompt.length < 10)
                throw new Error("توصیف تصویر را با دست‌کم ۱۰ حرف بنویس.");
              await request<{ media: { url: string } }>(
                `/sites/${site.id}/ai/image`,
                json({ prompt: requestedPrompt }),
              );
              setMessage("تصویر ساخته و به کتابخانه اضافه شد.");
              await list.reload();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setOperation(null);
              setBusy(false);
            }
          }}
        >
          <TextArea
            aria-label="توصیف تصویر دلخواه برای تولید با هوش مصنوعی"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            minLength={10}
            maxLength={4000}
            placeholder="یک فضای معماری مینیمال با نور طبیعی صبح، دیوارهای کرم و گیاهان سبز…"
            disabled={busy}
          />
          <Button loading={operation === "generate"} disabled={busy}>
            <Sparkles size={18} />
            {operation === "generate" ? "در حال ساخت تصویر…" : "ساخت تصویر"}
          </Button>
        </form>
        <div className="prompt-chips">
          {[
            "فضای کاری گرم با نور طبیعی",
            "تصویر آرام از محصولات مراقبت پوست",
            "گروهی خلاق در حال یادگیری",
          ].map((p) => (
            <ActionButton onClick={() => setPrompt(p)} key={p} disabled={busy}>
              {p}
            </ActionButton>
          ))}
        </div>
        <small>
          تولید تصویر به سرویس هوش مصنوعی پیکربندی‌شده و اعتبار حساب نیاز دارد.
        </small>
      </Card>
      <Notice message={error} error />
      <Notice message={message} />
      {operation === "generate" && (
        <p className="muted" role="status">
          درخواست ساخت تصویر در حال پردازش است؛ ممکن است چند دقیقه طول بکشد. تا
          دریافت نتیجه منتظر بمان.
        </p>
      )}
      <div className="content-toolbar">
        <h3>کتابخانه تصاویر</h3>
        <ActionButton
          className="btn btn-outline"
          disabled={busy}
          onClick={() => uploadRef.current?.click()}
        >
          <Upload size={17} />
          {operation === "upload"
            ? "در حال بهینه‌سازی…"
            : "بارگذاری و بهینه‌سازی"}
        </ActionButton>
        <input
          ref={uploadRef}
          type="file"
          hidden
          aria-label="بارگذاری تصویر در کتابخانه"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={async (e) => {
            if (busy) return;
            const input = e.currentTarget;
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setOperation("upload");
            setError("");
            setMessage("");
            try {
              if (
                ![
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "image/avif",
                ].includes(file.type)
              )
                throw new Error("تصویر JPG، PNG، WebP یا AVIF انتخاب کن.");
              if (file.size > 12 * 1024 * 1024)
                throw new Error("حجم تصویر باید حداکثر ۱۲ مگابایت باشد.");
              const data = new FormData();
              data.set("file", file);
              await request(`/sites/${site.id}/media`, {
                method: "POST",
                body: data,
              });
              setMessage("تصویر بهینه شد و در کتابخانه قرار گرفت.");
              await list.reload();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setOperation(null);
              setBusy(false);
              input.value = "";
            }
          }}
        />
      </div>
      <p className="editor-hint">
        تصاویر JPG، PNG، WebP یا AVIF تا ۱۲ مگابایت. برای استفاده در صفحه، نشانی
        تصویر را کپی و در بخش دلخواه ویرایشگر وارد کن.
      </p>
      <ListFeedback list={list} />
      {!list.busy &&
        !list.error &&
        (list.data.length ? (
          <div className="media-grid">
            {list.data.map((media) => (
              <Card
                render={(props) => <article {...props} />}
                className="media-card"
                key={media.id}
              >
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="مشاهده تصویر در اندازه اصلی"
                >
                  <img src={media.url} alt={media.prompt || "تصویر کتابخانه"} />
                </a>
                <ActionButton
                  onClick={async () => {
                    setError("");
                    setMessage("");
                    try {
                      await navigator.clipboard.writeText(media.url);
                      setMessage(
                        "نشانی تصویر کپی شد؛ در ویرایشگر بخش دلخواه قرار بده.",
                      );
                    } catch {
                      setError(
                        "کپی خودکار انجام نشد. تصویر را باز کن و نشانی آن را کپی کن.",
                      );
                    }
                  }}
                  disabled={busy}
                >
                  <Copy size={16} />
                  کپی نشانی تصویر
                </ActionButton>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="panel">
            <Empty
              title="جای تصاویر خوب اینجاست"
              description="عکس‌های خودت را بارگذاری کن تا برای وب بهینه شوند؛ یا تصویر تازه‌ای بساز."
            />
          </Card>
        ))}
    </>
  );
}
function SettingsPanel({
  site,
  onUpdate,
  onDirtyChange,
}: {
  site: Site;
  onUpdate: (site: Site) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savedSite, setSavedSite] = useState(site);
  const [siteName, setSiteName] = useState(site.name);
  const [brandName, setBrandName] = useState(site.draft.brand.name);
  const [tagline, setTagline] = useState(site.draft.brand.tagline);
  const [primaryColor, setPrimaryColor] = useState(
    site.draft.brand.primaryColor,
  );
  const [seoTitle, setSeoTitle] = useState(site.seo.title);
  const [seoDescription, setSeoDescription] = useState(site.seo.description);
  const hasChanges =
    siteName !== savedSite.name ||
    brandName !== savedSite.draft.brand.name ||
    tagline !== savedSite.draft.brand.tagline ||
    primaryColor !== savedSite.draft.brand.primaryColor ||
    seoTitle !== savedSite.seo.title ||
    seoDescription !== savedSite.seo.description;
  usePendingChanges(hasChanges, onDirtyChange);
  const [siteAddress, setSiteAddress] = useState(`/s/${site.slug}`);
  useEffect(() => {
    setSiteAddress(new URL(`/s/${site.slug}`, window.location.origin).href);
  }, [site.slug]);
  return (
    <Card
      render={(props) => <section {...props} />}
      className="panel content-panel settings-panel"
    >
      <form
        className="stack-form"
        key={site.id}
        onChangeCapture={() => {
          setMessage("");
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const data = Object.fromEntries(new FormData(e.currentTarget));
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const name = String(data.name || "").trim();
            const brandName = String(data.brandName || "").trim();
            if (!name || !brandName)
              throw new Error("نام فضای کار و نام برند را وارد کن.");
            const result = await request<{ site: Site }>(
              `/sites/${site.id}`,
              json(
                {
                  name,
                  seo: { title: data.title, description: data.description },
                  draft: {
                    ...site.draft,
                    brand: {
                      ...site.draft.brand,
                      name: brandName,
                      tagline: data.tagline,
                      primaryColor: data.primaryColor,
                    },
                  },
                },
                "PATCH",
              ),
            );
            setSiteName(result.site.name);
            setBrandName(result.site.draft.brand.name);
            setTagline(result.site.draft.brand.tagline);
            setPrimaryColor(result.site.draft.brand.primaryColor);
            setSeoTitle(result.site.seo.title);
            setSeoDescription(result.site.seo.description);
            setSavedSite(result.site);
            onUpdate(result.site);
            setMessage(
              "تنظیمات پیش‌نویس ذخیره شد. برای نمایش در سایت آن را منتشر کنید.",
            );
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="editor-hint">
          نام، برند و تنظیمات جستجو ابتدا در پیش‌نویس ذخیره می‌شوند. برای نمایش
          تغییرات به مخاطبان، سایت را از ویرایشگر منتشر کن.
        </p>
        <h3>هویت سایت</h3>
        <div className="form-two-col">
          <label>
            نام در فضای کار
            <Input
              name="name"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              required
              maxLength={160}
              disabled={busy}
            />
          </label>
          <label>
            نام برند در سایت
            <Input
              name="brandName"
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              required
              maxLength={160}
              disabled={busy}
            />
          </label>
        </div>
        <label>
          شعار برند
          <Input
            name="tagline"
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            maxLength={500}
            disabled={busy}
          />
        </label>
        <label>
          رنگ برند
          <Input
            type="color"
            name="primaryColor"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            disabled={busy}
          />
        </label>
        <hr />
        <h3>نمایش در موتورهای جستجو</h3>
        <label>
          عنوان صفحه
          <Input
            name="title"
            value={seoTitle}
            onChange={(event) => setSeoTitle(event.target.value)}
            maxLength={160}
            disabled={busy}
          />
        </label>
        <label>
          توضیحات صفحه
          <TextArea
            name="description"
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            rows={3}
            maxLength={500}
            disabled={busy}
          />
        </label>
        <div className="search-preview">
          <span dir="ltr">{siteAddress}</span>
          <h3>{seoTitle || siteName}</h3>
          <p>{seoDescription}</p>
        </div>
        <Notice message={message} />
        <Notice message={error} error />
        {hasChanges && (
          <p className="muted" role="status">
            تغییرات این صفحه هنوز ذخیره نشده‌اند.
          </p>
        )}
        <Button loading={busy} disabled={busy}>
          ذخیره تغییرات <Check size={17} />
        </Button>
        {message && !hasChanges && (
          <Link href={`/editor/${site.id}`} className="text-btn">
            رفتن به ویرایشگر و انتشار تغییرات <ArrowUpLeft size={15} />
          </Link>
        )}
      </form>
    </Card>
  );
}
