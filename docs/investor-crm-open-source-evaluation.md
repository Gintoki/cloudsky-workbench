# 投资人 CRM 适配评估

## 结论

选用 [Twenty](https://github.com/twentyhq/twenty) 作为产品模型参考，而不直接嵌入或克隆其完整运行时。Twenty 的 Companies、People、Opportunities、Tasks、Notes 和 Workflows 对投资人关系管理很有借鉴价值；但其完整部署还需要独立的 Postgres、Redis、任务队列和认证边界。

当前工作台已具备 Next.js、PostgreSQL、会话权限和审计日志。将投资人 CRM 直接实现为原生模块能保持单一登录、单一组织隔离、同一审计链路，并让路演记录直接关联机构账户，不制造第二套后台。

## 映射

| CRM 概念 | 当前工作台实体 | 说明 |
| --- | --- | --- |
| Company | `investor_accounts` | 投资机构、家办、产业资本或个人主体 |
| People | `investor_contacts` | 机构联系人及首要联系人标识 |
| Activity / Note | `roadshow_records` | 路演时间、纪要、音频链接、关键结论与下一步行动 |
| Transcript | `roadshow_transcript_segments` | 带开始/结束时间的文字片段 |
| Activity timeline | 机构的 `last_interaction_at` 与路演聚合 | 新增路演自动回写最近互动和后续行动 |

## 后续边界

- 音频暂保存可访问链接，不复制音频文件；需要对象存储后再增加上传。
- 不接入 Twenty 的完整服务端，避免重复的权限、认证和数据同步。
- 可在后续增加机会、基金偏好、Q&A 与邮件/日历集成，但都应继续归属当前组织与审计模型。
