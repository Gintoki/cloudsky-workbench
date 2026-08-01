"use client";

import { FileAudio, Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useApiData } from "@/lib/client/use-api-data";
import {
  roadshowFormatLabels,
  investorVisibilityLabels,
  type InvestorCrmData,
  type RoadshowListData,
} from "@/lib/investor-relations/types";
import { ErrorState, LoadingState } from "./page-states";
import { EmptyState, PageHeader, SectionCard, StatusBadge } from "./ui/workbench-primitives";

type SegmentDraft = { startSeconds: string; endSeconds: string; speaker: string; content: string };

const initialSegment: SegmentDraft = { startSeconds: "", endSeconds: "", speaker: "", content: "" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function timeLabel(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function emptyValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function RoadshowView({ canCreate }: { canCreate: boolean }) {
  const roadshows = useApiData<RoadshowListData>("/api/roadshows");
  const investors = useApiData<InvestorCrmData>("/api/investor-crm");
  const [formOpen, setFormOpen] = useState(false);
  const [segments, setSegments] = useState<SegmentDraft[]>([{ ...initialSegment }]);
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const preparedSegments = segments
      .filter((segment) => segment.content.trim())
      .map((segment) => ({
        startSeconds: Number(segment.startSeconds || 0),
        endSeconds: Number(segment.endSeconds || 0),
        speaker: segment.speaker.trim(),
        content: segment.content.trim(),
      }));
    setSaving(true);
    setWriteError("");
    try {
      const response = await fetch("/api/roadshows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          investorAccountId: form.get("investorAccountId"),
          title: emptyValue(form.get("title")),
          format: form.get("format"),
          occurredAt: form.get("occurredAt"),
          durationSeconds: emptyValue(form.get("durationSeconds")),
          audioUrl: emptyValue(form.get("audioUrl")),
          transcript: emptyValue(form.get("transcript")),
          keyTakeaways: emptyValue(form.get("keyTakeaways")),
          nextAction: emptyValue(form.get("nextAction")),
          followUpDueAt: emptyValue(form.get("followUpDueAt")),
          visibility: form.get("visibility"),
          segments: preparedSegments,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "保存路演记录失败。");
      setFormOpen(false);
      setSegments([{ ...initialSegment }]);
      await Promise.all([roadshows.retry(), investors.retry()]);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "保存路演记录失败。");
    } finally {
      setSaving(false);
    }
  }

  if (roadshows.loading || investors.loading) return <LoadingState />;
  if (roadshows.error || investors.error || !roadshows.data || !investors.data) return <ErrorState retry={() => { void roadshows.retry(); void investors.retry(); }} />;

  const canRecord = canCreate && investors.data.accounts.length > 0 && investors.data.databaseAvailable;
  return (
    <main className="page roadshow-page">
      <PageHeader
        title="投资人路演记录"
        description="以投资人机构为索引保存会议音频链接、文字纪要和可定位的时间轴。"
        meta={<StatusBadge tone={roadshows.data.databaseAvailable ? "success" : "warning"}>{roadshows.data.databaseAvailable ? "记录已持久化" : "数据库未接入"}</StatusBadge>}
        actions={canRecord ? <button className="button" onClick={() => { setFormOpen(true); setWriteError(""); }} type="button"><Plus size={15} /> 记录路演</button> : undefined}
      />

      {!investors.data.accounts.length && <EmptyState title="请先建立投资人机构" description="路演记录必须关联至已有机构，避免后续互动无法追溯。" />}
      {formOpen && (
        <SectionCard title="记录路演" eyebrow="音频链接与时间轴文字可独立保存">
          <form className="roadshow-form" onSubmit={(event) => void submit(event)}>
            <div className="investor-form-grid">
              <label>投资人机构<select name="investorAccountId" required>{investors.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
              <label>会议主题<input name="title" placeholder="例如：2026H1 经营更新" required /></label>
              <label>形式<select defaultValue="ONLINE" name="format">{Object.entries(roadshowFormatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>可见范围<select defaultValue="TEAM" name="visibility">{Object.entries(investorVisibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>会议时间<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
              <label>时长（秒）<input min="0" name="durationSeconds" type="number" /></label>
              <label>音频链接<input name="audioUrl" placeholder="https://…/recording.mp3" type="url" /></label>
              <label>后续行动<input name="nextAction" placeholder="例如：补充经营问题回复" /></label>
              <label>跟进日期<input name="followUpDueAt" type="date" /></label>
            </div>
            <label>文字纪要<textarea name="transcript" placeholder="记录会议主要内容；敏感信息仅在授权范围内保存。" /></label>
            <label>关键结论<textarea name="keyTakeaways" placeholder="记录已沟通的重点、待办和投资人关注点。" /></label>
            <div className="roadshow-segments-header"><div><strong>时间轴文字</strong><span>可选；填写后可定位至音频区间。</span></div><button className="button secondary" onClick={() => setSegments((items) => [...items, { ...initialSegment }])} type="button"><Plus size={14} /> 新增片段</button></div>
            <div className="roadshow-segments">{segments.map((segment, index) => <div className="roadshow-segment-editor" key={index}><input aria-label="开始秒数" min="0" onChange={(event) => setSegments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, startSeconds: event.target.value } : item))} placeholder="开始秒" type="number" value={segment.startSeconds} /><input aria-label="结束秒数" min="0" onChange={(event) => setSegments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, endSeconds: event.target.value } : item))} placeholder="结束秒" type="number" value={segment.endSeconds} /><input aria-label="发言人" onChange={(event) => setSegments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, speaker: event.target.value } : item))} placeholder="发言人" value={segment.speaker} /><input aria-label="文字内容" onChange={(event) => setSegments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, content: event.target.value } : item))} placeholder="对应文字内容" value={segment.content} /><button aria-label="删除时间轴片段" className="os-icon-button" disabled={segments.length === 1} onClick={() => setSegments((items) => items.filter((_, itemIndex) => itemIndex !== index))} title="删除片段" type="button"><Trash2 size={14} /></button></div>)}</div>
            <div className="investor-form-actions"><button className="button secondary" onClick={() => setFormOpen(false)} type="button">取消</button><button className="button" disabled={saving} type="submit"><Save size={14} /> 保存记录</button></div>
          </form>
        </SectionCard>
      )}

      <section className="roadshow-timeline" aria-label="路演记录列表">
        {roadshows.data.records.length ? roadshows.data.records.map((record) => <article className="roadshow-record" key={record.id}><div className="roadshow-record-meta"><StatusBadge tone="info">{roadshowFormatLabels[record.format] ?? record.format}</StatusBadge><StatusBadge>{investorVisibilityLabels[record.visibility]}</StatusBadge><span>{dateLabel(record.occurredAt)}</span></div><div className="roadshow-record-heading"><div><h2>{record.title}</h2><p>{record.investorAccountName}</p></div>{record.audioUrl && <a className="roadshow-audio-link" href={record.audioUrl} rel="noreferrer" target="_blank"><FileAudio size={15} /> 打开音频</a>}</div>{record.keyTakeaways && <p className="roadshow-takeaways">{record.keyTakeaways}</p>}{record.transcript && <details className="roadshow-details"><summary>查看文字纪要</summary><p>{record.transcript}</p></details>}{record.segments.length > 0 && <details className="roadshow-details"><summary>查看时间轴文字（{record.segments.length} 段）</summary><ol>{record.segments.map((segment) => <li key={segment.id}><time className="mono">{timeLabel(segment.startSeconds)} - {timeLabel(segment.endSeconds)}</time>{segment.speaker && <strong>{segment.speaker}</strong>}<span>{segment.content}</span></li>)}</ol></details>}{record.nextAction && <div className="roadshow-next-action"><strong>下一步</strong><span>{record.nextAction}</span>{record.followUpDueAt && <time>{record.followUpDueAt}</time>}</div>}</article>) : <EmptyState title="暂无路演记录" description="建立机构后，可在这里保存每次沟通的音频链接、纪要与可追溯时间轴。" />}
      </section>
      {writeError && <p className="investor-write-error">{writeError}</p>}
    </main>
  );
}
