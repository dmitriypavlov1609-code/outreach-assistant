const STORAGE_KEY = "outreachAssistantV1";

const defaults = {
  profile: {
    ownerName: "",
    brandName: "",
    ownerEmail: "",
    ownerContact: "",
    offerText: "Создаем приложения, ботов и автоматизируем процессы в разных нишах."
  },
  cases: [],
  clients: [],
  templates: [],
  campaign: []
};

let state = loadState();

const ownerName = document.getElementById("ownerName");
const brandName = document.getElementById("brandName");
const ownerEmail = document.getElementById("ownerEmail");
const ownerContact = document.getElementById("ownerContact");
const offerText = document.getElementById("offerText");

const githubUser = document.getElementById("githubUser");
const fetchGithubBtn = document.getElementById("fetchGithubBtn");
const caseTitle = document.getElementById("caseTitle");
const caseUrl = document.getElementById("caseUrl");
const caseNiche = document.getElementById("caseNiche");
const addCaseBtn = document.getElementById("addCaseBtn");
const casesList = document.getElementById("casesList");

const clientName = document.getElementById("clientName");
const clientCompany = document.getElementById("clientCompany");
const clientEmail = document.getElementById("clientEmail");
const clientNiche = document.getElementById("clientNiche");
const addClientBtn = document.getElementById("addClientBtn");
const clientsList = document.getElementById("clientsList");

const templateChannel = document.getElementById("templateChannel");
const templateName = document.getElementById("templateName");
const templateBody = document.getElementById("templateBody");
const addTemplateBtn = document.getElementById("addTemplateBtn");
const templatesList = document.getElementById("templatesList");

const campaignTemplate = document.getElementById("campaignTemplate");
const campaignFilterNiche = document.getElementById("campaignFilterNiche");
const buildCampaignBtn = document.getElementById("buildCampaignBtn");
const sendAllBtn = document.getElementById("sendAllBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const campaignStats = document.getElementById("campaignStats");
const campaignList = document.getElementById("campaignList");

const seedBtn = document.getElementById("seedBtn");
const clearBtn = document.getElementById("clearBtn");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaults);
    }
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...parsed,
      profile: { ...structuredClone(defaults.profile), ...(parsed.profile || {}) },
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      campaign: Array.isArray(parsed.campaign) ? parsed.campaign : []
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function statusLabel(status) {
  if (status === "sent") {
    return "Отправлено";
  }
  if (status === "read") {
    return "Прочитано";
  }
  if (status === "replied") {
    return "Ответ";
  }
  if (status === "failed") {
    return "Ошибка";
  }
  return "Черновик";
}

function fillTemplate(template, client) {
  const nicheCases = state.cases
    .filter((item) => !client.niche || !item.niche || item.niche.toLowerCase().includes(client.niche.toLowerCase()))
    .slice(0, 3);

  const examples = nicheCases.length > 0
    ? nicheCases.map((item) => `${item.title}: ${item.url}`).join("\n")
    : state.cases.slice(0, 3).map((item) => `${item.title}: ${item.url}`).join("\n");

  const map = {
    "{{client_name}}": client.name || "",
    "{{company}}": client.company || "",
    "{{niche}}": client.niche || "",
    "{{offer}}": state.profile.offerText || "",
    "{{examples}}": examples || "(добавьте кейсы GitHub)",
    "{{owner_name}}": state.profile.ownerName || "",
    "{{contact}}": state.profile.ownerContact || state.profile.ownerEmail || ""
  };

  let result = template;
  Object.entries(map).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });
  return result;
}

function syncProfileInputs() {
  ownerName.value = state.profile.ownerName;
  brandName.value = state.profile.brandName;
  ownerEmail.value = state.profile.ownerEmail;
  ownerContact.value = state.profile.ownerContact;
  offerText.value = state.profile.offerText;
}

function updateProfileFromInputs() {
  state.profile.ownerName = ownerName.value.trim();
  state.profile.brandName = brandName.value.trim();
  state.profile.ownerEmail = ownerEmail.value.trim();
  state.profile.ownerContact = ownerContact.value.trim();
  state.profile.offerText = offerText.value.trim();
  saveState();
}

function renderCases() {
  casesList.innerHTML = "";
  if (state.cases.length === 0) {
    casesList.innerHTML = '<p class="meta">Кейсов пока нет. Добавьте вручную или импортируйте из GitHub.</p>';
    return;
  }

  state.cases.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-head">
        <strong>${esc(item.title)}</strong>
        <button class="ghost" data-del-case="${item.id}">Удалить</button>
      </div>
      <div class="meta">Ниша: ${esc(item.niche || "не указана")}</div>
      <p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.url)}</a></p>
    `;
    casesList.appendChild(div);
  });
}

function renderClients() {
  clientsList.innerHTML = "";
  if (state.clients.length === 0) {
    clientsList.innerHTML = '<p class="meta">Список клиентов пуст.</p>';
    return;
  }

  state.clients.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-head">
        <strong>${esc(item.name || item.company || "Без имени")}</strong>
        <button class="ghost" data-del-client="${item.id}">Удалить</button>
      </div>
      <div class="meta">${esc(item.company || "")} · ${esc(item.niche || "ниша не указана")}</div>
      <p>${esc(item.email || "без email")}</p>
    `;
    clientsList.appendChild(div);
  });
}

function renderTemplates() {
  templatesList.innerHTML = "";
  if (state.templates.length === 0) {
    templatesList.innerHTML = '<p class="meta">Шаблоны пока не добавлены.</p>';
  } else {
    state.templates.forEach((item) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item-head">
          <strong>${esc(item.name)}</strong>
          <button class="ghost" data-del-template="${item.id}">Удалить</button>
        </div>
        <div class="meta">Канал: ${esc(item.channel)}</div>
        <p>${esc(item.body)}</p>
      `;
      templatesList.appendChild(div);
    });
  }

  campaignTemplate.innerHTML = "";
  state.templates.forEach((t) => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = `${t.name} (${t.channel})`;
    campaignTemplate.appendChild(option);
  });

  campaignFilterNiche.innerHTML = '<option value="all">Все ниши</option>';
  const niches = [...new Set(state.clients.map((c) => (c.niche || "").trim()).filter(Boolean))];
  niches.forEach((niche) => {
    const option = document.createElement("option");
    option.value = niche;
    option.textContent = niche;
    campaignFilterNiche.appendChild(option);
  });
}

function renderCampaign() {
  campaignList.innerHTML = "";
  const total = state.campaign.length;
  const withEmail = state.campaign.filter((x) => x.email).length;
  const sent = state.campaign.filter((x) => x.status === "sent").length;
  const read = state.campaign.filter((x) => x.status === "read").length;
  const replied = state.campaign.filter((x) => x.status === "replied").length;
  const failed = state.campaign.filter((x) => x.status === "failed").length;
  campaignStats.textContent = total > 0
    ? `Сообщений: ${total} · с email: ${withEmail} · отправлено: ${sent} · прочитано: ${read} · ответы: ${replied} · ошибки: ${failed}`
    : "Кампания не собрана.";

  state.campaign.forEach((item) => {
    const badgeClass = item.status ? `badge ${item.status}` : "badge";
    const timeline = [
      item.sentAt ? `Отправка: ${new Date(item.sentAt).toLocaleString("ru-RU")}` : "",
      item.readAt ? `Прочтение: ${new Date(item.readAt).toLocaleString("ru-RU")}` : "",
      item.repliedAt ? `Ответ: ${new Date(item.repliedAt).toLocaleString("ru-RU")}` : ""
    ].filter(Boolean).join(" · ");
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-head">
        <strong>${esc(item.clientName)} / ${esc(item.company || "Компания")}</strong>
        <span class="${badgeClass}">${statusLabel(item.status)}</span>
      </div>
      <div class="meta">${esc(item.channel)} · ${esc(item.email || "без email")}</div>
      <div class="meta">${esc(item.subject || "Без темы")}</div>
      <div class="meta">${esc(timeline || "Статусов пока нет")}</div>
      <p>${esc(item.message)}</p>
      ${item.error ? `<div class="meta">Ошибка: ${esc(item.error)}</div>` : ""}
      <div class="actions">
        <button data-send="${item.id}">Отправить</button>
        <button class="ghost" data-copy="${item.id}">Копировать</button>
        <button data-mailto="${item.id}">Открыть email</button>
        <button class="ghost" data-mark-read="${item.id}">Отметить прочитано</button>
        <button class="ghost" data-mark-replied="${item.id}">Отметить ответ</button>
        <button class="ghost" data-reset-status="${item.id}">Сброс статуса</button>
      </div>
    `;
    campaignList.appendChild(div);
  });
}

function renderAll() {
  syncProfileInputs();
  renderCases();
  renderClients();
  renderTemplates();
  renderCampaign();
}

function addCase() {
  const title = caseTitle.value.trim();
  const url = caseUrl.value.trim();
  const niche = caseNiche.value.trim();
  if (!title || !url) {
    alert("Введите название и ссылку кейса.");
    return;
  }
  state.cases.unshift({ id: uid("case"), title, url, niche });
  caseTitle.value = "";
  caseUrl.value = "";
  caseNiche.value = "";
  saveState();
  renderCases();
}

function addClient() {
  const name = clientName.value.trim();
  const company = clientCompany.value.trim();
  const email = clientEmail.value.trim();
  const niche = clientNiche.value.trim();

  if (!name && !company) {
    alert("Укажите имя или компанию клиента.");
    return;
  }

  state.clients.unshift({ id: uid("client"), name, company, email, niche });
  clientName.value = "";
  clientCompany.value = "";
  clientEmail.value = "";
  clientNiche.value = "";
  saveState();
  renderClients();
  renderTemplates();
}

function addTemplate() {
  const name = templateName.value.trim();
  const body = templateBody.value.trim();
  const channel = templateChannel.value;

  if (!name || !body) {
    alert("Укажите название и текст шаблона.");
    return;
  }

  state.templates.unshift({ id: uid("tpl"), name, body, channel });
  templateName.value = "";
  templateBody.value = "";
  saveState();
  renderTemplates();
}

function buildCampaign() {
  const templateId = campaignTemplate.value;
  const niche = campaignFilterNiche.value;
  const template = state.templates.find((t) => t.id === templateId);

  if (!template) {
    alert("Выберите шаблон для кампании.");
    return;
  }

  const clients = niche === "all"
    ? state.clients
    : state.clients.filter((c) => (c.niche || "").toLowerCase() === niche.toLowerCase());

  state.campaign = clients.map((client) => ({
    id: uid("msg"),
    channel: template.channel,
    clientId: client.id,
    clientName: client.name || "",
    company: client.company || "",
    niche: client.niche || "",
    email: client.email || "",
    subject: `Идеи автоматизации для ${client.company || client.name || "вашего бизнеса"}`,
    message: fillTemplate(template.body, client),
    createdAt: new Date().toISOString(),
    status: "draft",
    sentAt: null,
    readAt: null,
    repliedAt: null,
    error: "",
    providerMessageId: ""
  }));

  saveState();
  renderCampaign();
}

function exportCampaignCsv() {
  if (state.campaign.length === 0) {
    alert("Сначала соберите кампанию.");
    return;
  }

  const rows = ["client_name,company,email,niche,channel,subject,status,sent_at,read_at,replied_at,message"];
  state.campaign.forEach((item) => {
    const cols = [
      item.clientName,
      item.company,
      item.email,
      item.niche,
      item.channel,
      item.subject || "",
      item.status || "draft",
      item.sentAt || "",
      item.readAt || "",
      item.repliedAt || "",
      item.message
    ].map((v) => `"${String(v || "").replaceAll('"', '""')}"`);
    rows.push(cols.join(","));
  });

  downloadFile(`campaign_${Date.now()}.csv`, rows.join("\n"), "text/csv;charset=utf-8");
}

function exportCampaignJson() {
  if (state.campaign.length === 0) {
    alert("Сначала соберите кампанию.");
    return;
  }
  downloadFile(`campaign_${Date.now()}.json`, JSON.stringify(state.campaign, null, 2), "application/json;charset=utf-8");
}

function updateCampaignItem(itemId, patch) {
  const idx = state.campaign.findIndex((item) => item.id === itemId);
  if (idx < 0) {
    return null;
  }
  state.campaign[idx] = { ...state.campaign[idx], ...patch };
  saveState();
  renderCampaign();
  return state.campaign[idx];
}

async function sendCampaignItem(itemId) {
  const item = state.campaign.find((x) => x.id === itemId);
  if (!item) {
    return;
  }
  if (item.channel !== "email") {
    alert("Автоотправка сейчас доступна только для email-шаблонов.");
    return;
  }
  if (!item.email) {
    alert("У клиента нет email.");
    return;
  }
  if (!state.profile.ownerEmail) {
    alert("Заполните ваш контактный email в профиле.");
    return;
  }

  updateCampaignItem(itemId, { error: "" });
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: item.email,
        subject: item.subject || "Предложение по автоматизации",
        text: item.message,
        fromName: state.profile.brandName || state.profile.ownerName || "Outreach Assistant",
        replyTo: state.profile.ownerEmail
      })
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload.error || "Не удалось отправить письмо.");
    }

    updateCampaignItem(itemId, {
      status: "sent",
      sentAt: new Date().toISOString(),
      error: "",
      providerMessageId: payload.messageId || ""
    });
  } catch (error) {
    updateCampaignItem(itemId, {
      status: "failed",
      error: error.message || "Ошибка отправки"
    });
  }
}

async function sendAllEmails() {
  const queue = state.campaign.filter((item) => item.channel === "email" && item.email);
  if (queue.length === 0) {
    alert("Нет email-сообщений для отправки.");
    return;
  }

  sendAllBtn.disabled = true;
  sendAllBtn.textContent = "Отправка...";
  for (const item of queue) {
    // Отправка по одному сообщению, чтобы видеть статус каждого.
    // eslint-disable-next-line no-await-in-loop
    await sendCampaignItem(item.id);
  }
  sendAllBtn.disabled = false;
  sendAllBtn.textContent = "Отправить всем email";
}

async function importGithubRepos() {
  const user = githubUser.value.trim();
  if (!user) {
    alert("Введите username GitHub.");
    return;
  }

  fetchGithubBtn.disabled = true;
  fetchGithubBtn.textContent = "Импорт...";
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=20&sort=updated`);
    if (!res.ok) {
      throw new Error("Не удалось получить репозитории");
    }

    const repos = await res.json();
    const existingUrls = new Set(state.cases.map((item) => item.url));

    repos.slice(0, 10).forEach((repo) => {
      if (!existingUrls.has(repo.html_url)) {
        state.cases.push({
          id: uid("case"),
          title: repo.name,
          url: repo.html_url,
          niche: ""
        });
      }
    });

    saveState();
    renderCases();
  } catch (error) {
    alert(error.message || "Ошибка импорта GitHub.");
  } finally {
    fetchGithubBtn.disabled = false;
    fetchGithubBtn.textContent = "Импорт из GitHub";
  }
}

function seedDemo() {
  state.profile = {
    ownerName: "Дмитрий",
    brandName: "Automation Studio",
    ownerEmail: "hello@automation-studio.dev",
    ownerContact: "@automation_studio",
    offerText: "Разрабатываем приложения, AI-ботов и автоматизируем бизнес-процессы под конкретную нишу."
  };

  state.cases = [
    {
      id: uid("case"),
      title: "Transport Company Profit Planner",
      url: "https://github.com/dmitriypavlov1609-code/transport-company-profit-planner",
      niche: "логистика"
    },
    {
      id: uid("case"),
      title: "AI Career Copilot",
      url: "https://github.com/dmitriypavlov1609-code/ai-career-copilot",
      niche: "hr"
    }
  ];

  state.clients = [
    { id: uid("client"), name: "Алексей", company: "TransMove", email: "ceo@transmove.example", niche: "логистика" },
    { id: uid("client"), name: "Мария", company: "Beauty Space", email: "owner@beautyspace.example", niche: "бьюти" }
  ];

  state.templates = [
    {
      id: uid("tpl"),
      name: "Первичный контакт",
      channel: "email",
      body: "Здравствуйте, {{client_name}}!\n\nМеня зовут {{owner_name}}. Мы в {{offer}}\n\nДля {{niche}} у нас уже есть рабочие примеры:\n{{examples}}\n\nЕсли актуально, предложу 2-3 идеи автоматизации под {{company}} и оценку сроков.\n\nКонтакт: {{contact}}"
    }
  ];

  state.campaign = [];
  saveState();
  renderAll();
}

function clearAll() {
  if (!confirm("Удалить все данные приложения?")) {
    return;
  }
  state = structuredClone(defaults);
  saveState();
  renderAll();
}

casesList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-del-case]");
  if (!btn) {
    return;
  }
  state.cases = state.cases.filter((item) => item.id !== btn.dataset.delCase);
  saveState();
  renderCases();
});

clientsList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-del-client]");
  if (!btn) {
    return;
  }
  state.clients = state.clients.filter((item) => item.id !== btn.dataset.delClient);
  saveState();
  renderClients();
  renderTemplates();
});

templatesList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-del-template]");
  if (!btn) {
    return;
  }
  state.templates = state.templates.filter((item) => item.id !== btn.dataset.delTemplate);
  saveState();
  renderTemplates();
});

campaignList.addEventListener("click", async (event) => {
  const sendBtn = event.target.closest("button[data-send]");
  if (sendBtn) {
    await sendCampaignItem(sendBtn.dataset.send);
    return;
  }

  const copyBtn = event.target.closest("button[data-copy]");
  if (copyBtn) {
    const item = state.campaign.find((x) => x.id === copyBtn.dataset.copy);
    if (!item) {
      return;
    }
    try {
      await navigator.clipboard.writeText(item.message);
      copyBtn.textContent = "Скопировано";
      setTimeout(() => { copyBtn.textContent = "Копировать"; }, 1000);
    } catch {
      alert("Не удалось скопировать.");
    }
    return;
  }

  const mailtoBtn = event.target.closest("button[data-mailto]");
  if (mailtoBtn) {
    const item = state.campaign.find((x) => x.id === mailtoBtn.dataset.mailto);
    if (!item || !item.email) {
      alert("У этого клиента нет email.");
      return;
    }
    const subject = encodeURIComponent("Предложение по автоматизации");
    const body = encodeURIComponent(item.message);
    window.location.href = `mailto:${encodeURIComponent(item.email)}?subject=${subject}&body=${body}`;
    return;
  }

  const markReadBtn = event.target.closest("button[data-mark-read]");
  if (markReadBtn) {
    updateCampaignItem(markReadBtn.dataset.markRead, {
      status: "read",
      readAt: new Date().toISOString()
    });
    return;
  }

  const markRepliedBtn = event.target.closest("button[data-mark-replied]");
  if (markRepliedBtn) {
    updateCampaignItem(markRepliedBtn.dataset.markReplied, {
      status: "replied",
      repliedAt: new Date().toISOString()
    });
    return;
  }

  const resetStatusBtn = event.target.closest("button[data-reset-status]");
  if (resetStatusBtn) {
    updateCampaignItem(resetStatusBtn.dataset.resetStatus, {
      status: "draft",
      sentAt: null,
      readAt: null,
      repliedAt: null,
      error: "",
      providerMessageId: ""
    });
  }
});

[ownerName, brandName, ownerEmail, ownerContact, offerText].forEach((input) => {
  input.addEventListener("input", updateProfileFromInputs);
});

addCaseBtn.addEventListener("click", addCase);
addClientBtn.addEventListener("click", addClient);
addTemplateBtn.addEventListener("click", addTemplate);
buildCampaignBtn.addEventListener("click", buildCampaign);
sendAllBtn.addEventListener("click", sendAllEmails);
downloadCsvBtn.addEventListener("click", exportCampaignCsv);
downloadJsonBtn.addEventListener("click", exportCampaignJson);
fetchGithubBtn.addEventListener("click", importGithubRepos);
seedBtn.addEventListener("click", seedDemo);
clearBtn.addEventListener("click", clearAll);

renderAll();
