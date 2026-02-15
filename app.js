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
  campaignStats.textContent = total > 0
    ? `Сообщений: ${total} · с email: ${withEmail} · без email: ${total - withEmail}`
    : "Кампания не собрана.";

  state.campaign.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-head">
        <strong>${esc(item.clientName)} / ${esc(item.company || "Компания")}</strong>
        <span class="meta">${esc(item.channel)}</span>
      </div>
      <div class="meta">${esc(item.email || "без email")}</div>
      <p>${esc(item.message)}</p>
      <div class="actions">
        <button class="ghost" data-copy="${item.id}">Копировать</button>
        <button data-mailto="${item.id}">Открыть email</button>
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
    message: fillTemplate(template.body, client),
    createdAt: new Date().toISOString()
  }));

  saveState();
  renderCampaign();
}

function exportCampaignCsv() {
  if (state.campaign.length === 0) {
    alert("Сначала соберите кампанию.");
    return;
  }

  const rows = ["client_name,company,email,niche,channel,message"];
  state.campaign.forEach((item) => {
    const cols = [
      item.clientName,
      item.company,
      item.email,
      item.niche,
      item.channel,
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
  }
});

[ownerName, brandName, ownerEmail, ownerContact, offerText].forEach((input) => {
  input.addEventListener("input", updateProfileFromInputs);
});

addCaseBtn.addEventListener("click", addCase);
addClientBtn.addEventListener("click", addClient);
addTemplateBtn.addEventListener("click", addTemplate);
buildCampaignBtn.addEventListener("click", buildCampaign);
downloadCsvBtn.addEventListener("click", exportCampaignCsv);
downloadJsonBtn.addEventListener("click", exportCampaignJson);
fetchGithubBtn.addEventListener("click", importGithubRepos);
seedBtn.addEventListener("click", seedDemo);
clearBtn.addEventListener("click", clearAll);

renderAll();
