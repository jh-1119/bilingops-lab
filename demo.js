const samples = {
  academy: `Hello, we are interested in your Korean language program for two students from Singapore.

They arrive in Seoul on June 18 and need an intensive 4-week course. Could you send the schedule, price, visa support information, and whether classes can include TOPIK preparation?

We need the answer this week because the parents are comparing schools.

Regards,
Melissa Tan
BrightPath Education
melissa@brightpath.example`,
  export: `안녕하세요.

저희는 베트남 유통사이고, 귀사의 스킨케어 제품 500개 샘플 견적과 영문 성분표를 받고 싶습니다.

가능하면 이번 주 금요일 전까지 FOB 가격, 최소 주문 수량, 리드타임, 결제 조건을 알려주세요. 내부 승인 후 2,000개 이상으로 늘릴 수 있습니다.

담당자: Nguyen Minh
이메일: minh@saigontrade.example`,
  commerce: `Hi support team,

I ordered three ceramic mugs last week. One arrived broken and another has the wrong color. The order number is KR-20491.

I already sent photos through the contact form but nobody replied. Please tell me if you can resend the damaged items or refund this order.

Thanks,
Jenna Lee
jenna.lee@example.com`
};

const sampleButtons = document.querySelectorAll(".sample-button");
const inquiry = document.querySelector("#inquiry");
const outputLanguage = document.querySelector("#output-language");
const tone = document.querySelector("#tone");
const detectedLanguage = document.querySelector("#detected-language");
const statusPill = document.querySelector("#status-pill");
const category = document.querySelector("#category");
const urgency = document.querySelector("#urgency");
const owner = document.querySelector("#owner");
const timeSaved = document.querySelector("#time-saved");
const summary = document.querySelector("#summary");
const actions = document.querySelector("#actions");
const risks = document.querySelector("#risks");
const reply = document.querySelector("#reply");
const crmFields = document.querySelector("#crm-fields");

let latestResult = null;

function detectLanguage(text) {
  const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
  const hasEnglish = /[a-z]/i.test(text);
  if (hasKorean && hasEnglish) return "mixed";
  if (hasKorean) return "Korean";
  if (hasEnglish) return "English";
  return "unknown";
}

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "Not found";
}

function extractOrder(text) {
  return text.match(/\b[A-Z]{2,4}-\d{3,}\b/)?.[0] || "Not found";
}

function extractName(text) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const email = extractEmail(text);
  const emailName = email !== "Not found" ? email.split("@")[0].replace(/[._-]/g, " ") : "";
  const labeledContact = lines.find((line) => /^담당자\s*:/i.test(line));
  if (labeledContact) return labeledContact.replace(/^담당자\s*:\s*/i, "");
  const signoffIndex = lines.findIndex((line) => /regards|thanks|감사|담당자/i.test(line));
  if (signoffIndex >= 0 && lines[signoffIndex + 1]) {
    const candidate = lines[signoffIndex + 1].replace(/^담당자:\s*/, "");
    if (!/^이메일\s*:/i.test(candidate) && !/@/.test(candidate)) return candidate;
  }
  if (emailName) return emailName.replace(/\b\w/g, (char) => char.toUpperCase());
  return "Unknown contact";
}

function classify(text) {
  const lower = text.toLowerCase();
  if (/course|topik|student|academy|language|수업|학생|학원/.test(lower)) {
    return {
      category: "Education inquiry",
      owner: "Admissions",
      summaryKo: "해외 학생 대상 한국어 집중 과정 문의입니다. 일정, 가격, 비자 지원, TOPIK 준비 포함 여부를 빠르게 안내해야 합니다.",
      summaryEn: "Inquiry about an intensive Korean language course for international students. The reply should cover schedule, pricing, visa support, and TOPIK preparation."
    };
  }
  if (/fob|moq|quote|quotation|견적|성분표|주문 수량|리드타임|결제 조건/.test(lower)) {
    return {
      category: "Export quote",
      owner: "Sales ops",
      summaryKo: "해외 유통사의 샘플 견적 요청입니다. FOB 가격, MOQ, 리드타임, 결제 조건, 영문 성분표가 필요합니다.",
      summaryEn: "Export distributor quote request. The reply should include FOB pricing, MOQ, lead time, payment terms, and English ingredient documents."
    };
  }
  if (/broken|wrong color|refund|resend|order|damaged|파손|환불|교환/.test(lower)) {
    return {
      category: "Support issue",
      owner: "Customer support",
      summaryKo: "주문 상품 파손 및 오배송 클레임입니다. 사진 확인, 재발송 또는 환불 정책 안내가 필요합니다.",
      summaryEn: "Customer complaint about damaged and incorrect items. The team should verify photos and offer replacement or refund options."
    };
  }
  return {
    category: "General inquiry",
    owner: "Operations",
    summaryKo: "반복 업무로 처리 가능한 일반 문의입니다. 요청사항을 확인하고 필요한 추가 정보를 받아야 합니다.",
    summaryEn: "General inquiry that can be handled through a structured workflow. Confirm the request and collect any missing details."
  };
}

function detectUrgency(text) {
  if (/today|urgent|asap|이번 주|금요일|this week|nobody replied|빠르게/i.test(text)) return "High";
  if (/next week|soon|가능하면/i.test(text)) return "Medium";
  return "Normal";
}

function buildActions(text, info) {
  const base = [];
  if (info.category === "Education inquiry") {
    base.push("확정 가능한 4주 집중 과정 일정과 수강료를 확인한다.");
    base.push("비자 지원 가능 범위와 TOPIK 준비 포함 여부를 내부 기준에 맞게 표시한다.");
    base.push("부모 비교 일정에 맞춰 이번 주 안에 답장한다.");
  } else if (info.category === "Export quote") {
    base.push("500개 샘플 기준 FOB 가격과 2,000개 이상 예상 가격 범위를 확인한다.");
    base.push("MOQ, 리드타임, 결제 조건, 영문 성분표 파일을 준비한다.");
    base.push("금요일 전 회신 가능하도록 영업 담당자 검토를 요청한다.");
  } else if (info.category === "Support issue") {
    base.push("주문번호와 사진 접수 여부를 확인한다.");
    base.push("파손 상품 재발송 가능 여부와 오배송 상품 처리 기준을 확인한다.");
    base.push("지연 응대에 대해 사과하고 예상 처리 시간을 안내한다.");
  } else {
    base.push("요청사항과 누락 정보를 확인한다.");
    base.push("담당자를 지정하고 다음 회신 시점을 정한다.");
  }
  if (extractEmail(text) !== "Not found") base.push("CRM에 이메일과 문의 유형을 저장한다.");
  return base;
}

function buildRisks(text, urgencyValue) {
  const items = [];
  if (urgencyValue === "High") items.push("응답 지연 시 경쟁사로 이탈할 가능성이 있습니다.");
  if (/visa|refund|payment|결제|비자|환불/i.test(text)) items.push("정책, 비용, 환불, 비자 관련 문장은 사람 검토가 필요합니다.");
  if (/nobody replied|아무도|reply/i.test(text)) items.push("이전 응대 지연에 대한 사과와 처리 시점 안내가 필요합니다.");
  if (!items.length) items.push("큰 리스크는 낮지만, 고객에게 나가는 최종 문장은 검토해야 합니다.");
  return items;
}

function estimateSavings(info) {
  if (info.category === "Education inquiry") return "8-14 h/mo";
  if (info.category === "Export quote") return "10-18 h/mo";
  if (info.category === "Support issue") return "12-24 h/mo";
  return "4-8 h/mo";
}

function buildReply(info, text, language, selectedTone) {
  const name = extractName(text);
  const openerKo = selectedTone === "warm" ? "안녕하세요" : "안녕하세요";
  const openerEn = selectedTone === "warm" ? "Hi" : "Hello";

  if (language === "en") {
    if (info.category === "Education inquiry") {
      return `${openerEn} ${name},\n\nThank you for reaching out. We can help review availability for a 4-week intensive Korean course starting around June 18, including whether TOPIK preparation can be included.\n\nBefore confirming the final schedule and price, we will check class level, preferred study intensity, and visa-support boundaries. We will also prepare a clear comparison-friendly summary for the parents.\n\nWe will follow up with the schedule, pricing, visa-support information, and TOPIK option in one reply.\n\nBest,\nOperations Team`;
    }
    if (info.category === "Export quote") {
      return `${openerEn} ${name},\n\nThank you for your inquiry. We can prepare the 500-unit sample quotation and the English ingredient document for internal review.\n\nThe reply should include FOB pricing, minimum order quantity, lead time, payment terms, and an indicative range for a larger 2,000+ unit order if available.\n\nWe will route this to sales operations for review before sending the final quote.\n\nBest,\nOperations Team`;
    }
    if (info.category === "Support issue") {
      return `${openerEn} ${name},\n\nThank you for letting us know, and sorry for the delayed response. We will check order ${extractOrder(text)} and review the photos you submitted.\n\nIf the damage and wrong-color item are confirmed, the next step is to offer a replacement shipment or refund based on the store policy. We will reply with the exact option and timing after review.\n\nBest,\nOperations Team`;
    }
    return `${openerEn} ${name},\n\nThank you for the details. We will review the request, confirm the missing information, and route it to the right owner before replying with next steps.\n\nBest,\nOperations Team`;
  }

  if (info.category === "Education inquiry") {
    return `${openerKo}, ${name}님.\n\n문의 감사합니다. 6월 18일 전후 시작 가능한 4주 집중 한국어 과정과 TOPIK 준비 포함 가능 여부를 확인하겠습니다.\n\n최종 일정과 비용 안내 전, 학생 레벨, 희망 수업 강도, 비자 지원 가능 범위를 함께 확인하면 더 정확한 답변을 드릴 수 있습니다. 부모님이 비교하기 쉽도록 일정, 가격, 비자 지원, TOPIK 옵션을 한 번에 정리해 회신드리겠습니다.\n\n감사합니다.\n담당팀`;
  }
  if (info.category === "Export quote") {
    return `${openerKo}, ${name}님.\n\n문의 감사합니다. 500개 샘플 기준 견적과 영문 성분표 준비 가능 여부를 확인하겠습니다.\n\n회신에는 FOB 가격, 최소 주문 수량, 리드타임, 결제 조건, 2,000개 이상 주문 시 예상 조건을 함께 정리하는 것이 좋습니다. 최종 발송 전 영업 담당자가 가격과 조건을 검토해야 합니다.\n\n감사합니다.\n담당팀`;
  }
  if (info.category === "Support issue") {
    return `${openerKo}, ${name}님.\n\n불편을 드려 죄송합니다. 주문번호 ${extractOrder(text)}와 접수하신 사진을 먼저 확인하겠습니다.\n\n파손 상품과 색상 오배송이 확인되면 정책에 따라 재발송 또는 환불 가능 옵션을 안내드리는 것이 좋습니다. 확인 후 처리 방법과 예상 일정을 함께 회신드리겠습니다.\n\n감사합니다.\n담당팀`;
  }
  return `${openerKo}, ${name}님.\n\n문의 감사합니다. 요청 내용을 확인한 뒤 필요한 추가 정보와 담당자를 정리해 다음 단계로 안내드리겠습니다.\n\n감사합니다.\n담당팀`;
}

function buildCrm(text, info, urgencyValue) {
  return {
    contact: extractName(text),
    email: extractEmail(text),
    category: info.category,
    urgency: urgencyValue,
    owner: info.owner,
    order: extractOrder(text)
  };
}

function renderList(target, items) {
  target.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function renderCrm(fields) {
  crmFields.innerHTML = "";
  for (const [key, value] of Object.entries(fields)) {
    const item = document.createElement("div");
    const label = document.createElement("span");
    const strong = document.createElement("strong");
    label.textContent = key;
    strong.textContent = value;
    item.append(label, strong);
    crmFields.appendChild(item);
  }
}

function runWorkflow() {
  const text = inquiry.value.trim();
  const info = classify(text);
  const urgencyValue = detectUrgency(text);
  const language = outputLanguage.value;
  const detected = detectLanguage(text);
  const result = {
    info,
    urgency: urgencyValue,
    actions: buildActions(text, info),
    risks: buildRisks(text, urgencyValue),
    reply: buildReply(info, text, language, tone.value),
    crm: buildCrm(text, info, urgencyValue),
    detected,
    timeSaved: estimateSavings(info)
  };

  latestResult = result;
  detectedLanguage.textContent = `Language: ${detected}`;
  statusPill.textContent = urgencyValue === "High" ? "Needs review" : "Draft ready";
  statusPill.style.color = urgencyValue === "High" ? "var(--red)" : "var(--green-dark)";
  category.textContent = info.category;
  urgency.textContent = urgencyValue;
  owner.textContent = info.owner;
  timeSaved.textContent = result.timeSaved;
  summary.textContent = language === "ko" ? info.summaryKo : info.summaryEn;
  renderList(actions, result.actions);
  renderList(risks, result.risks);
  reply.value = result.reply;
  renderCrm(result.crm);
}

function setSample(name) {
  inquiry.value = samples[name];
  sampleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sample === name);
  });
  runWorkflow();
}

function downloadCsv() {
  if (!latestResult) runWorkflow();
  const headers = Object.keys(latestResult.crm);
  const values = headers.map((key) => `"${String(latestResult.crm[key]).replaceAll('"', '""')}"`);
  const csv = `${headers.join(",")}\n${values.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bilingops-inquiry-fields.csv";
  link.click();
  URL.revokeObjectURL(url);
}

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => setSample(button.dataset.sample));
});

document.querySelector("#run").addEventListener("click", runWorkflow);
document.querySelector("#copy-reply").addEventListener("click", async () => {
  if (!reply.value) runWorkflow();
  await navigator.clipboard.writeText(reply.value);
  statusPill.textContent = "Reply copied";
});
document.querySelector("#download-csv").addEventListener("click", downloadCsv);
outputLanguage.addEventListener("change", runWorkflow);
tone.addEventListener("change", runWorkflow);
inquiry.addEventListener("input", () => {
  detectedLanguage.textContent = `Language: ${detectLanguage(inquiry.value)}`;
});

setSample("academy");
