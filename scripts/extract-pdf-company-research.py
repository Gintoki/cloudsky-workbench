"""Create compact, page-cited research excerpts from the supplied PDF."""

import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


SECTIONS = [
    ("智谱", 1),
    ("泡泡玛特", 7),
    ("山西汾酒", 13),
    ("拼多多", 27),
    ("中际旭创", 38),
    ("东鹏饮料", 49),
    ("药明康德", 52),
    ("快手", 63),
    ("腾讯控股", 70),
    ("涛涛车业", 78),
    ("顺网科技", 87),
    ("三花智控", 99),
    ("宁德时代", 105),
    ("金山办公", 113),
    ("片仔癀", 116),
    ("美的集团", 124),
    ("格力电器", 136),
    ("阿里巴巴", 148),
    ("绿的谐波", 152),
    ("隆基绿能", 161),
    ("信维通信", 166),
    ("完美世界", 176),
    ("京东方", 186),
    ("深信服", 194),
]


def normalise(value: str) -> str:
    value = re.sub(r"\n\s*分区 投资方法框架 的第 \d+ 页\s*", "\n", value)
    value = re.sub(r"\n\s*\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2}\s*", "\n", value)
    return re.sub(r"[ \t]+", " ", value).strip()


def excerpt(value: str, markers: tuple[str, ...], limit: int) -> str:
    positions = [value.find(marker) for marker in markers if value.find(marker) >= 0]
    start = min(positions) if positions else 0
    return normalise(value[start : start + limit])


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract-pdf-company-research.py input.pdf output.json")

    pages = [page.extract_text() or "" for page in PdfReader(sys.argv[1]).pages]
    records = []
    for index, (name, page_start) in enumerate(SECTIONS):
        page_end = SECTIONS[index + 1][1] - 1 if index + 1 < len(SECTIONS) else len(pages)
        content = "\n".join(pages[page_start - 1 : page_end])
        dates = re.findall(r"(20\d{2})年(\d{1,2})月(\d{1,2})日", content)
        source_date = None
        if dates:
            year, month, day = dates[0]
            source_date = f"{year}-{int(month):02d}-{int(day):02d}"
        records.append(
            {
                "name": name,
                "pageStart": page_start,
                "pageEnd": page_end,
                "sourceDate": source_date,
                "conclusion": excerpt(content, ("结论",), 680),
                "businessModel": excerpt(content, ("能力圈评估", "商业模式"), 760),
                "assumptions": excerpt(content, ("关键假设",), 900),
                "financial": excerpt(content, ("财务快照", "核心财务数据"), 900),
                "valuation": excerpt(content, ("当前市场定价", "估值"), 950),
                "risks": excerpt(content, ("关键风险", "风险一"), 750),
            }
        )

    Path(sys.argv[2]).write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
