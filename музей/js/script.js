// Скрипт сайта музея «Наследие». Использует данные из data.js (объект MUSEUM).
document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initTheme();
    showDateAndStatus();
    initBackToTop();
    initServiceFilter();
    initRouteForm();
    initContactForm();
    initPlan();
    initChat();
});

/* ---------- 1. Меню для смартфона ---------- */
function initMenu() {
    var btn = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
        nav.classList.toggle("open");
    });
}

/* ---------- 2. Переключение темы (с запоминанием) ---------- */
function initTheme() {
    var btn = document.getElementById("theme-toggle");
    try {
        if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
    } catch (e) { /* localStorage недоступен — не страшно */ }
    if (!btn) return;
    btn.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        try {
            localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
        } catch (e) {}
    });
}

/* ---------- 3. Текущая дата и статус «открыто/закрыто» ---------- */
function isOpenNow(date) {
    var d = date.getDay();
    var h = date.getHours();
    return MUSEUM.openDays.indexOf(d) !== -1 && h >= MUSEUM.openHour && h < MUSEUM.closeHour;
}

function showDateAndStatus() {
    var dateEl = document.getElementById("current-date");
    var statusEl = document.getElementById("open-status");
    var now = new Date();
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (statusEl) {
        statusEl.textContent = isOpenNow(now) ? "музей сейчас открыт" : "музей сейчас закрыт";
    }
}

/* ---------- 4. Кнопка «Наверх» ---------- */
function initBackToTop() {
    var btn = document.createElement("button");
    btn.id = "to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Наверх");
    btn.textContent = "↑";
    document.body.appendChild(btn);
    window.addEventListener("scroll", function () {
        btn.style.display = window.scrollY > 300 ? "block" : "none";
    });
    btn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* ---------- 5. Фильтр услуг ---------- */
function initServiceFilter() {
    var buttons = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll("#services-grid .card");
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var filter = btn.getAttribute("data-filter");
            buttons.forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            cards.forEach(function (card) {
                var show = filter === "all" || card.getAttribute("data-category") === filter;
                card.classList.toggle("hidden", !show);
            });
        });
    });
}

/* ---------- 6. Подбор маршрута по залам ---------- */
function buildRoute(minutes, interest) {
    var halls = MUSEUM.halls.filter(function (h) {
        return interest === "all" || h.theme === interest;
    });
    var route = [];
    var used = 0;
    halls.forEach(function (h) {
        if (used + h.minutes <= minutes) {
            route.push(h);
            used += h.minutes;
        }
    });
    return { halls: route, total: used };
}

function routeToText(result) {
    if (!result.halls.length) {
        return "За это время не получится осмотреть залы выбранной темы. Попробуйте увеличить время.";
    }
    var lines = result.halls.map(function (h, i) {
        return (i + 1) + ". " + h.name + " (" + h.floor + " этаж, ~" + h.minutes + " мин) — " + h.desc;
    });
    return lines.join("\n") + "\nИтого: около " + result.total + " минут.";
}

function initRouteForm() {
    var form = document.getElementById("route-form");
    var out = document.getElementById("route-result");
    if (!form || !out) return;
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var minutes = parseInt(document.getElementById("route-time").value, 10);
        var interest = document.getElementById("route-interest").value;
        var result = buildRoute(minutes, interest);
        out.innerHTML = "";
        var title = document.createElement("h3");
        title.textContent = "Ваш маршрут (" + MUSEUM.themeNames[interest] + ", " + minutes + " мин)";
        out.appendChild(title);
        if (!result.halls.length) {
            var p = document.createElement("p");
            p.textContent = routeToText(result);
            out.appendChild(p);
            return;
        }
        var ol = document.createElement("ol");
        result.halls.forEach(function (h) {
            var li = document.createElement("li");
            li.textContent = h.name + " — " + h.floor + " этаж, ~" + h.minutes + " мин (" + h.desc + ")";
            ol.appendChild(li);
        });
        out.appendChild(ol);
        var total = document.createElement("p");
        total.innerHTML = "<strong>Итого:</strong> около " + result.total + " минут.";
        out.appendChild(total);
    });
}

/* ---------- 7. Проверка контактной формы ---------- */
function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var success = document.getElementById("form-success");

    function setError(id, message) {
        var field = document.getElementById(id);
        document.getElementById(id + "-error").textContent = message;
        field.classList.toggle("invalid", message !== "");
        return message === "";
    }

    // Имя и фамилия: цифры не вводятся
    ["lastname", "firstname"].forEach(function (id) {
        document.getElementById(id).addEventListener("input", function () {
            this.value = this.value.replace(/[0-9]/g, "");
        });
    });

    // Телефон: +7 уже стоит, вводятся только цифры, максимум 10
    document.getElementById("phone").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        success.textContent = "";
        var lastname = document.getElementById("lastname").value.trim();
        var firstname = document.getElementById("firstname").value.trim();
        var email = document.getElementById("email").value.trim();
        var phone = document.getElementById("phone").value.trim();
        var topic = document.getElementById("topic").value.trim();
        var message = document.getElementById("message").value.trim();
        var nameRe = /^[A-Za-zА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ][A-Za-zА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ\s'-]*$/;

        function checkName(value) {
            if (value === "") return "Заполните поле";
            if (/[0-9]/.test(value)) return "В имени не должно быть цифр";
            if (!nameRe.test(value)) return "Только буквы, пробел и дефис";
            return "";
        }

        var ok = true;
        ok = setError("lastname", checkName(lastname)) && ok;
        ok = setError("firstname", checkName(firstname)) && ok;
        ok = setError("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Введите корректный e-mail") && ok;
        ok = setError("phone", /^\d{10}$/.test(phone) ? "" : "После +7 нужно ввести ровно 10 цифр") && ok;
        ok = setError("topic", topic.length >= 3 ? "" : "Укажите тему обращения") && ok;
        ok = setError("message", message.length >= 10 ? "" : "Сообщение должно быть не короче 10 символов") && ok;

        if (ok) {
            success.textContent = "Спасибо, " + firstname + "! Ваше сообщение отправлено (демо-режим).";
            form.reset();
        }
    });
}

/* ---------- План музея ---------- */
function initPlan() {
    var info = document.getElementById("plan-info");
    var tabs = document.querySelectorAll(".floor-btn");
    if (!info || !tabs.length) return;
    var rooms = document.querySelectorAll(".room[data-name]");

    function showFloor(n) {
        tabs.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-floor") === String(n)); });
        [1, 2].forEach(function (i) {
            var svg = document.getElementById("floor-" + i);
            if (!svg) return;
            if (i === n) svg.removeAttribute("hidden"); else svg.setAttribute("hidden", "");
        });
    }
    tabs.forEach(function (b) {
        b.addEventListener("click", function () { showFloor(parseInt(b.getAttribute("data-floor"), 10)); });
    });

    function select(el) {
        rooms.forEach(function (r) { r.classList.remove("selected"); });
        el.classList.add("selected");
        var name = el.getAttribute("data-name");
        var hall = MUSEUM.halls.filter(function (h) { return h.name === name; })[0];
        var place = MUSEUM.places.filter(function (p) { return p.name === name; })[0];
        info.innerHTML = "";
        var h2 = document.createElement("h2");
        h2.textContent = name;
        info.appendChild(h2);
        var p1 = document.createElement("p");
        p1.textContent = hall ? hall.desc.charAt(0).toUpperCase() + hall.desc.slice(1) + "." : "";
        if (hall) info.appendChild(p1);
        var p2 = document.createElement("p");
        p2.textContent = (place ? place.where : "") + (hall ? " Осмотр займёт около " + hall.minutes + " минут." : "");
        info.appendChild(p2);
    }
    rooms.forEach(function (r) {
        if (!r.hasAttribute("tabindex")) return;
        r.addEventListener("click", function () { select(r); });
        r.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(r); }
        });
    });
}

/* ---------- 8. Помощник: простой чат на основе заготовленных ответов ---------- */
function answerQuestion(text) {
    var q = text.toLowerCase();

    // Где находится зал или служба
    var asksWhere = /где|на каком этаж|этаж|как пройти|найти/.test(q);
    if (asksWhere && !/адрес|добрат|проезд/.test(q)) {
        var found = MUSEUM.places.filter(function (p) {
            return p.stems.some(function (st) { return q.indexOf(st) !== -1; });
        });
        if (found.length) {
            return found.map(function (p) { return p.name + ": " + p.where; }).join("\n") + "\nСхема — на странице «План».";
        }
    }

    // Маршрут: ищем время и интерес в тексте вопроса
    var wantsRoute = /маршрут|за час|за \d|часа|минут|что посмотреть|что посмотр/.test(q);
    if (wantsRoute) {
        var minutes = 60;
        var m = q.match(/(\d+)\s*мин/);
        if (m) minutes = parseInt(m[1], 10);
        else if (/2 часа|два часа|2 ч/.test(q)) minutes = 120;
        else if (/полтора|1,5|1\.5/.test(q)) minutes = 90;
        else if (/полчаса|30 мин/.test(q)) minutes = 30;
        var interest = "all";
        if (/истори|кочев|древн/.test(q)) interest = "history";
        else if (/искусств|картин|живопис|золот/.test(q)) interest = "art";
        else if (/дет|ребен|ребён/.test(q)) interest = "kids";
        else if (/наук|техник|изобрет/.test(q)) interest = "science";
        var result = buildRoute(minutes, interest);
        return "Маршрут на " + minutes + " мин (" + MUSEUM.themeNames[interest] + "):\n" + routeToText(result);
    }

    var best = null;
    var bestScore = 0;
    MUSEUM.intents.forEach(function (intent) {
        var score = 0;
        intent.keys.forEach(function (k) { if (q.indexOf(k) !== -1) score++; });
        if (score > bestScore) { best = intent; bestScore = score; }
    });

    if (!best) {
        return "Я пока не знаю ответа на этот вопрос. Спросите про цены, часы работы, залы, экскурсии или попросите составить маршрут. Также можно написать нам на странице «Контакты».";
    }
    if (best.answer === "price") {
        var lines = [];
        for (var k in MUSEUM.prices) lines.push(k + ": " + MUSEUM.prices[k] + " ₸");
        return "Стоимость билетов:\n" + lines.join("\n");
    }
    if (best.answer === "hours") {
        return "Мы работаем со вторника по воскресенье, 09:00–20:00. Понедельник — выходной.\nСейчас музей " + (isOpenNow(new Date()) ? "открыт." : "закрыт.");
    }
    if (best.answer === "halls") {
        return "Залы музея:\n" + MUSEUM.halls.map(function (h) { return "• " + h.name + " — " + h.desc; }).join("\n");
    }
    if (best.answer === "route") {
        return "Подберу маршрут! Напишите, сколько у вас времени и что интересно, например: «маршрут на 1 час по истории».";
    }
    return best.answer;
}

function initChat() {
    var toggle = document.createElement("button");
    toggle.id = "chat-toggle";
    toggle.type = "button";
    toggle.textContent = "Помощник";

    var win = document.createElement("div");
    win.id = "chat-window";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Помощник музея");
    win.innerHTML =
        '<div class="chat-head"><span>Помощник музея</span><button type="button" id="chat-close" aria-label="Закрыть">×</button></div>' +
        '<div class="chat-messages" id="chat-messages" aria-live="polite"></div>' +
        '<div class="chat-chips" id="chat-chips"></div>' +
        '<form class="chat-form" id="chat-form"><input type="text" id="chat-input" placeholder="Задайте вопрос…" autocomplete="off"><button type="submit">Отправить</button></form>';

    document.body.appendChild(toggle);
    document.body.appendChild(win);

    var messages = document.getElementById("chat-messages");
    var chips = document.getElementById("chat-chips");
    var form = document.getElementById("chat-form");
    var input = document.getElementById("chat-input");

    function addMessage(text, who) {
        var div = document.createElement("div");
        div.className = "msg " + who;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function ask(text) {
        addMessage(text, "user");
        setTimeout(function () { addMessage(answerQuestion(text), "bot"); }, 350);
    }

    MUSEUM.suggestions.forEach(function (s) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = s;
        chip.addEventListener("click", function () { ask(s); });
        chips.appendChild(chip);
    });

    function openChat() {
        win.classList.add("open");
        if (!messages.children.length) {
            addMessage("Здравствуйте! Я помощник музея «Наследие». Спросите про цены, график, залы или попросите составить маршрут.", "bot");
        }
        input.focus();
    }

    toggle.addEventListener("click", function () {
        if (win.classList.contains("open")) win.classList.remove("open"); else openChat();
    });
    document.getElementById("chat-close").addEventListener("click", function () {
        win.classList.remove("open");
    });
    var heroBtn = document.getElementById("open-chat-hero");
    if (heroBtn) heroBtn.addEventListener("click", openChat);

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        input.value = "";
        ask(text);
    });
}
