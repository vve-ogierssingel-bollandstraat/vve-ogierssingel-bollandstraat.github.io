"use strict";

const translations = {
  en: {
    navRules:"Building rules",navUpdates:"Owner updates",navReport:"Report an issue",title:"Report confidentially to the VvE",
    intro:"You do not need to enter your name or address. Use the number of an access tag issued to your apartment. Only authorised board members and the VvE manager may use the existing tag records to link it to an apartment. Your identity will not be disclosed to other residents without necessity.",
    emergency:"This form is not for emergencies. Call 112 if there is immediate danger.",urgent:"For leaks, breakdowns or other urgent building problems, call the VvE 24-hour breakdown service:",unavailable:"This reporting form is being prepared. You can view the fields, but cannot submit a report yet.",
    identity:"1. Your access tag",tag:"Your tag number",tagHelp:"Copy the number from your tag. Leading zeroes are preserved. A previously issued, deactivated tag may still be recognised in the records.",anonymous:"I do not have a tag number and only want to submit an anonymous signal.",tagWhere:"Where do I find this number?",tagWhereTitle:"The number on your tag",tagWhereBody:"A code is printed on the metal bracket of your tag. Copy that number exactly, including any leading zeroes. If your tag has no code, choose the anonymous signal option instead.",tagWhereAlt:"Two tags with an arrow pointing to the code on the metal bracket, and an input field where that number is entered.",close:"Close",anonymousHelp:"Without a recognised tag number, we treat the report only as an anonymous signal. A signal alone is not grounds for a warning or penalty.",
    event:"2. What happened?",category:"Type of report",choose:"Select an option",noise:"Noise",smoke:"Smoke / odour",dirt:"Litter / dirt",safety:"Safety",damage:"Damage",technical:"Technical issue",other:"Other",date:"Date of the incident",time:"Time of the incident (optional)",timeHelp:"Local time in Rotterdam. Enter when it happened, not when you are filling in this form.",precisionHelp:"Without a specific date and time we can only record a report as a signal, not handle it as a complaint.",duration:"How long did it last?",dur1:"Less than 15 minutes",dur2:"15 minutes to 1 hour",dur3:"1 to 3 hours",dur4:"3 to 6 hours",dur5:"6 to 12 hours",dur6:"More than 12 hours",dur7:"Continuous, almost constant",dur8:"Still going on right now",durationHelp:"An estimate is enough. Choose \"continuous\" if it is not a single incident.",location:"Location or apartment involved",locationHelp:"Where did it happen? Do not enter your own address as contact information here if you want to remain anonymous.",description:"Description of the incident",descriptionHelp:"Describe what you personally saw, heard or smelled. At least 20 characters. Avoid unnecessary names or other personal details. You may write in your own language.",repeated:"Has this happened before?",yes:"Yes",no:"No",unknown:"I don't know",repeatDetails:"When / how often? (optional)",attachments:"Add evidence (optional)",attachmentHelp:"Up to 3 files: JPG, PNG or PDF, maximum 2 MB per file. Check file names and contents for unnecessary personal information.",
    followup:"3. Follow-up",contact:"The board may contact me using the existing VvE records.",contactHelp:"Only if the tag can be linked to an apartment. The board will contact you using the details registered for your apartment. Under article 20 of the division regulations, owners are required to register their tenants and occupants with the VvE.",truthful:"I confirm that this report has been completed truthfully.",submit:"Submit report",receiptHelp:"Once received, your report gets a random reference number. Keep it for further communication. You will not receive an automatic email.",success:"Your report has been received",saveNumber:"Keep this reference number. Use it for correspondence instead of your tag number.",receivedHelp:"The board will review the report and check the tag internally. Your tag number and apartment are not displayed here.",newReport:"Submit another report",
    privacy:"Your information",privacyPurpose:"VvE Ogierssingel 263/301 – Bollandstraat 29/35 uses your report for building management, maintenance and handling nuisance. Authorised board members and the VvE manager handle it confidentially. The tag number is encrypted separately; the existing link to the apartment remains in the VvE records.",privacyStorage:"This portal retains reports for up to 180 days and unlinked signals for up to 30 days. If a case needs longer handling, the board keeps only what is necessary, for at most two years after the case is closed. The board reviews these files once a year. Working copies made by handlers fall under the same term and are deleted once the case is closed. Email alerts to handlers contain only the report reference.",privacyMore:"Technology, access and your rights",privacyTech:"GitHub hosts the website. Cloudflare provides the security check and receives the report; contents and attachments are stored encrypted. Resend delivers only an alert with the reference number to the handlers. These services also process technical connection data such as an IP address. We do not store your IP address in the report or save the form in browser storage. There is no public report listing.",privacyRights:"Contact the board with questions about access, correction, deletion or objection. Provide your reference number. The board assesses requests and may verify your identity through existing records. You may also complain to the Dutch Data Protection Authority.",
    sending:"Sending…",invalid:"Please check the required fields.",fileError:"Use at most 3 JPG, PNG or PDF files, each no larger than 2 MB.",tagError:"Enter a tag number of 4–32 letters or digits, or choose an anonymous signal.",captcha:"Complete the security check before sending.",serverError:"Receipt could not be confirmed. Your input is still here. Please try again later. A report may already have arrived; mention a possible duplicate if you retry.",rateError:"Too many attempts. Please wait a minute and try again.",captchaError:"The security check expired or failed. Please complete it again.",ready:"Your report is sent securely. The board will check your tag internally.",futureError:"The incident date cannot be in the future."
  },
  zh: {
    navRules:"建筑规则",navUpdates:"业主动态",navReport:"提交报告",title:"向业主委员会保密报告",intro:"无需填写姓名或地址。请使用发给您公寓的门禁标签编号。只有获授权的管理委员和物业经理可以通过现有记录将编号与公寓对应。没有必要时，不会向其他住户透露您的身份。",emergency:"此表不适用于紧急情况。如有直接危险，请拨打112。",urgent:"漏水、故障或其他紧急楼宇问题，请拨打业主委员会24小时报修电话：",unavailable:"报告表正在准备中。您可以查看字段，但目前无法提交。",identity:"1. 您的门禁标签",tag:"报告人的标签编号",tagHelp:"请照抄标签编号，保留开头的零。已停用的旧标签仍可能在记录中被识别。",anonymous:"我没有标签编号，只想提交匿名线索。",tagWhere:"在哪里找到这个编号？",tagWhereTitle:"标签上的编号",tagWhereBody:"标签的金属扣上印有一串编号。请完全照抄，包括开头的零。如果标签上没有编号，请选择匿名线索。",tagWhereAlt:"两个标签，箭头指向金属扣上的编号，以及填写该编号的输入框。",close:"关闭",anonymousHelp:"无法识别标签编号的报告仅作为匿名线索处理。单独的线索不能作为警告或处罚的依据。",event:"2. 发生了什么？",category:"报告类别",choose:"请选择",noise:"噪音",smoke:"烟雾／异味",dirt:"垃圾／污染",safety:"安全",damage:"损坏",technical:"技术故障",other:"其他",date:"事发日期",time:"事发时间（选填）",timeHelp:"鹿特丹当地时间。请填写事情发生的时间，而非您填写此表的时间。",precisionHelp:"没有具体日期和时间，我们只能将其记录为线索，无法作为正式投诉处理。",duration:"持续了多久？",dur1:"少于15分钟",dur2:"15分钟至1小时",dur3:"1至3小时",dur4:"3至6小时",dur5:"6至12小时",dur6:"超过12小时",dur7:"持续不断，几乎不停",dur8:"目前仍在持续",durationHelp:"估算即可。如果不是单次事件，请选择“持续不断”。",location:"事发地点或相关公寓",locationHelp:"事情在哪里发生？如果您希望保持匿名，请勿在此填写您自己的联系地址。",description:"事件描述",descriptionHelp:"描述您亲自看到、听到或闻到的情况，至少20个字符。避免不必要的姓名或其他个人信息。可以使用您自己的语言。",repeated:"以前发生过吗？",yes:"是",no:"否",unknown:"不知道",repeatDetails:"何时／多久一次？（选填）",attachments:"添加证据（选填）",attachmentHelp:"最多3个JPG、PNG或PDF文件，每个不超过2 MB。请检查文件名及内容中是否有不必要的个人信息。",followup:"3. 后续处理",contact:"管理委员会可以通过现有记录联系我。",contactHelp:"仅当标签可对应公寓时适用。管理委员会将通过您公寓登记的信息与您联系。根据分割规章第20条，业主有义务向业主委员会登记其租户和使用人。",truthful:"我声明此报告如实填写。",submit:"提交报告",receiptHelp:"收到报告后，您将获得随机报告编号，请保存以便后续联系。您不会收到自动邮件。",success:"已收到您的报告",saveNumber:"请保存此编号，以后联系时使用报告编号，不要使用门禁标签编号。",receivedHelp:"管理委员会将审核报告并在内部核对标签。此处不会显示标签编号或公寓信息。",newReport:"提交新报告",privacy:"您的信息",privacyPurpose:"Ogierssingel 263/301 – Bollandstraat 29/35业主委员会将报告用于楼宇管理、维修和滋扰处理。获授权的管理委员和物业经理会保密处理。标签编号单独加密保存，与公寓的现有对应关系仍留在业主委员会的记录中。",privacyStorage:"本系统最多保存报告180天，无法对应公寓的线索最多保存30天。如需更长处理时间，管理委员会仅保留必要信息，最长至案件结案后两年。管理委员会每年清理一次这些档案。处理人制作的工作副本适用相同期限，结案后即予删除。发送给处理人的邮件仅包含报告编号。",privacyMore:"技术、访问和您的权利",privacyTech:"GitHub托管网站。Cloudflare提供安全验证并接收报告，内容及附件加密保存。Resend仅向处理人发送包含报告编号的通知。这些服务还会处理IP地址等技术连接数据。我们不会在报告中保存您的IP地址，也不在浏览器存储中保存表单。没有公开报告列表。",privacyRights:"如需查阅、更正、删除或提出异议，请联系管理委员会并提供报告编号。管理委员会会评估请求，并可能通过现有记录核实身份。您也可以向荷兰数据保护局投诉。",sending:"正在发送…",invalid:"请检查必填字段。",fileError:"最多上传3个JPG、PNG或PDF文件，每个不超过2 MB。",tagError:"请填写4至32个字母或数字的标签编号，或选择匿名线索。",captcha:"发送前请完成安全验证。",serverError:"无法确认是否收到。您的内容仍在页面中，请稍后重试。报告可能已经送达，重试时请说明可能重复。",rateError:"尝试次数过多，请等待一分钟再试。",captchaError:"安全验证已过期或失败，请重新完成。",ready:"报告将安全发送。管理委员会会在内部核对标签。",futureError:"事件日期不能在未来。"
  }
};
const nl = {};
document.querySelectorAll("[data-i18n]").forEach(el => { nl[el.dataset.i18n] = el.textContent; });
Object.assign(nl,{tagWhereAlt:"Twee tags met een pijl naar de code op de metalen beugel, en een invoerveld waarin dat nummer wordt ingevuld.",sending:"Bezig met verzenden…",invalid:"Controleer de verplichte velden.",fileError:"Gebruik maximaal 3 JPG-, PNG- of PDF-bestanden van maximaal 2 MB per bestand.",tagError:"Vul een tagnummer van 4–32 letters of cijfers in, of kies voor een anoniem signaal.",captcha:"Rond de beveiligingscontrole af voordat u verzendt.",serverError:"De ontvangst kon niet worden bevestigd. Uw invoer staat er nog. Probeer het later opnieuw. Uw melding kan al wel zijn aangekomen; vermeld bij opnieuw verzenden dat het mogelijk een dubbele melding is.",rateError:"Te veel pogingen. Wacht een minuut en probeer opnieuw.",captchaError:"De beveiligingscontrole is verlopen of niet gelukt. Voer deze opnieuw uit.",ready:"Uw melding wordt beveiligd verzonden. Het bestuur controleert uw tag intern.",futureError:"De datum van de gebeurtenis mag niet in de toekomst liggen."});
translations.nl = nl;
const form = document.getElementById("report-form"), submit = document.getElementById("submit"), error = document.getElementById("error");
const config = window.VVE_MELDING_CONFIG || {};
let language = "nl", token = "", widgetId, busy = false, ready = false;
const t = key => translations[language][key] || nl[key];
const $ = id => document.getElementById(id);
const localDate = new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
$("event-date").max = localDate;
function setLanguage(code) {
  language = translations[code] ? code : "en";
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(el => {el.textContent = t(el.dataset.i18n);});
  document.querySelectorAll("[data-i18n-alt]").forEach(el => {el.alt = t(el.dataset.i18nAlt);});
  document.querySelectorAll("[data-language]").forEach(el => el.setAttribute("aria-pressed",String(el.dataset.language === language)));
  $("availability").textContent = t(ready ? "ready" : "unavailable");
  submit.textContent = t(busy ? "sending" : "submit");
  error.hidden = true;
}
document.querySelectorAll("[data-language]").forEach(el => el.addEventListener("click",() => setLanguage(el.dataset.language)));
setLanguage(new URLSearchParams(location.search).get("lang") || (navigator.language || "nl").split("-")[0]);
function showError(key) {error.textContent = t(key);error.hidden = false;error.focus();}
$("anonymous").addEventListener("change",() => {
  $("tag").disabled = $("anonymous").checked;
  $("tag").required = !$("anonymous").checked;
  $("contact").disabled = $("anonymous").checked;
  if ($("anonymous").checked) {$("tag").value = "";$("contact").checked = false;}
});
$("repeated").addEventListener("change",() => {$("repeat-field").hidden = $("repeated").value !== "ja";});
const tagHelp = $("tag-help-dialog");
$("tag-help-open").addEventListener("click",() => tagHelp.showModal());
$("tag-help-close").addEventListener("click",() => tagHelp.close());
tagHelp.addEventListener("click",event => {if (event.target === tagHelp) tagHelp.close();});
const DURATION_CATEGORIES = ["geluid","rook-geur"];
$("category").addEventListener("change",() => {
  const relevant = DURATION_CATEGORIES.includes($("category").value);
  $("duration-field").hidden = !relevant;
  $("duration").required = relevant;
  if (!relevant) $("duration").value = "";
});

// Do not load third-party code or send any data while this draft is disabled.
try {
  const endpoint = new URL(config.endpoint);
  ready = config.enabled === true && endpoint.protocol === "https:" && !endpoint.username && !endpoint.password && endpoint.pathname === "/api/meldingen" && !endpoint.search && !endpoint.hash && typeof config.turnstileSiteKey === "string" && config.turnstileSiteKey.length > 10;
} catch {ready = false;}
if (ready) {
  window.vveTurnstileLoaded = () => {
    widgetId = window.turnstile.render("#turnstile",{
      sitekey:config.turnstileSiteKey,action:"melding",language:language === "zh" ? "zh-cn" : language,
      callback:value => {token = value;submit.disabled = busy;},
      "expired-callback":() => {token = "";submit.disabled = true;},
      "error-callback":() => {token = "";submit.disabled = true;showError("captchaError");}
    });
  };
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=vveTurnstileLoaded&render=explicit";
  script.async = true;script.onerror = () => showError("captchaError");document.head.appendChild(script);
  $("availability").textContent = t("ready");
}
form.addEventListener("submit",async event => {
  event.preventDefault();
  if (!ready || busy) return;
  error.hidden = true;
  if (!form.reportValidity()) {showError("invalid");return;}
  const tag = $("tag").value.replace(/[\s-]/g,"").toUpperCase();
  if (!$("anonymous").checked && !/^[A-Z0-9]{4,32}$/.test(tag)) {showError("tagError");$("tag").focus();return;}
  if ($("event-date").value > localDate) {showError("futureError");return;}
  const files = Array.from($("attachments").files);
  if (files.length > 3 || files.some(f => f.size < 1 || f.size > 2*1024*1024 || !["image/jpeg","image/png","application/pdf"].includes(f.type))) {showError("fileError");return;}
  if (!token) {showError("captcha");return;}
  const data = new FormData();
  data.append("report",JSON.stringify({
    tag:$("anonymous").checked ? "" : tag,anonymous:$("anonymous").checked,category:$("category").value,
    eventDate:$("event-date").value,eventTime:$("event-time").value,timeZone:"Europe/Amsterdam",duration:$("duration-field").hidden ? "" : $("duration").value,
    location:$("location").value.trim(),description:$("description").value.trim(),repeated:$("repeated").value,
    repeatDetails:$("repeated").value === "ja" ? $("repeat-details").value.trim() : "",
    contactAllowed:$("contact").checked,truthful:$("truthful").checked,language,website:$("website").value
  }));
  data.append("turnstileToken",token);
  files.forEach(file => data.append("attachments",file));
  busy = true;submit.disabled = true;submit.textContent = t("sending");
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),30000);
  try {
    const response = await fetch(config.endpoint,{method:"POST",body:data,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",signal:controller.signal});
    const result = await response.json();
    if (!response.ok) {showError(response.status === 429 ? "rateError" : response.status === 403 ? "captchaError" : response.status === 400 || response.status === 413 ? "invalid" : "serverError");return;}
    if (response.status !== 201 || !/^VVE-[0-9A-F]{32}$/.test(result.reportId)) throw new Error("receipt");
    form.reset();form.hidden = true;$("availability").hidden = true;
    $("report-id").textContent = result.reportId;$("success").hidden = false;$("success").focus();
  } catch {showError("serverError");}
  finally {
    clearTimeout(timeout);busy = false;token = "";submit.disabled = true;submit.textContent = t("submit");
    if (!form.hidden && window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId);
  }
});
