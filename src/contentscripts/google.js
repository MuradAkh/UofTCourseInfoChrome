(function () {
  let queryDict = {};
  location.search.substr(1).split("&").forEach(function (item) {
    queryDict[item.split("=")[0]] = item.split("=")[1]
  });

  if (!/[a-zA-Z]{3}\+?[1-4a-dA-D][0-9]{2}/.test(queryDict["q"])) return; // doesn't match

  checkSettings()
    .then(enabled => enabled ? getInfo(queryDict["q"].replace("+", "")) : null)
      .then(generateCards)
    .catch(error => console.error(error))

})();

function checkSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(
      {
        gsearch: true
      }, function (items) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(items.gsearch);
        }
      });
  })
}

function generateCards(response){
  if (response.length > 0) {
    $(".card-section").parent().remove();

    let boot = document.createElement("div");
    boot.className = "bootstrapiso";

    response[0]["crawled"] = crawlOfferings(response);
    const code = response[0].code.substr(0, 6);
    let card = createCard(code, response[0]);
    boot.append(card);

    chrome.runtime.sendMessage(
        {msg: "ANL",
          eventCategory: 'Courses',
          eventAction: 'Search',
          eventLabel: code

        }, () => {});

    if (code.includes('csc')) {
      const num = parseInt(code.substring(3, 7));
      const cos = document.createElement('small');
      cos.appendChild(document.createTextNode(`Cosecant of ${num} is ${1/ Math.sin(num)}`));
      cos.className = "text-muted";
      cos.setAttribute('style', 'float: right; margin-top: 5px; margin-bottom: -10px');
      boot.appendChild(cos);

    }else{
      card.setAttribute("style", "margin-bottom: 20px");
    }

    $("#topstuff").append(boot);

    generateTooltips();

    $(".cinfo-link").click( function(event){
      chrome.runtime.sendMessage(
          {msg: "ANL",
            eventCategory: 'Navigation',
            eventAction: 'Search Navigation',
            eventLabel: event.target.innerText

          }, () => {});
    });
  }
}


function createHeader(code, name, department) {
  let header = document.createElement("div");
  header.className = "card-header";
  // header.setAttribute("style", "background: navy;");

  let card_title = document.createElement("h5");
  card_title.className = "card-title";
  card_title.innerText = code.toUpperCase() + ": " + name;

  let subtitle = document.createElement("h6");
  subtitle.className = "card-subtitle mb-2 text-muted";
  subtitle.innerText = department;

  let nav = document.createElement("ul");
  nav.className = "nav nav-tabs card-header-tabs pull-right";
  nav.setAttribute("role", "tablist");

  let first = true;
  ["Overview", "Requirements", "Instructors", "Offerings"].forEach(name => {
    let row = document.createElement("li");
    row.className = "nav-item";

    let link = document.createElement("a");
    link.innerText = name;
    let link_class = "nav-link cinfo-link";
    if (first) link_class += " active";
    link.className = link_class;
    link.setAttribute("id", name.toLowerCase() + "-tab");
    link.setAttribute("data-toggle", "tab");
    link.setAttribute("href", "#" + name.toLowerCase());
    link.setAttribute("role", "tab");
    link.setAttribute("aria-controls", name.toLowerCase());
    link.setAttribute("aria-selected", first.toString());
    link.setAttribute("style", "text-decoration: none !important;");
    first = false;
    row.append(link);
    nav.append(row);

  });
  header.append(card_title);
  header.append(subtitle);
  header.append(nav);
  return header;
}

function createOverview(parent, code, info) {
  let textbooks = document.createElement("a");
  textbooks.className = "btn btn-primary cinfo-link";
  textbooks.setAttribute("href", `http://courseinfo.murad-akh.ca/textbooks/index.html?filter?q=course_code:%22${code}%22`);
  textbooks.innerText = "View Textbooks";

  let exams = document.createElement("a");
  exams.className = "btn btn-primary cinfo-link";
  exams.setAttribute("style", "margin-left: 10px;");
  exams.setAttribute("href", `https://exams-library-utoronto-ca.myaccess.library.utoronto.ca/simple-search?location=%2F&query=${code}`);
  exams.innerText = "View Past Exams";

  let description_element = document.createElement("p");
  description_element.className = "card-text";
  description_element.appendChild(document.createTextNode(info.description));

  parent.append(description_element);
  parent.append(textbooks);
  parent.append(exams);
}

function createRequirements(parent, code, info) {
  const format = new RegExp('[A-Z][A-Z][A-Z][1-4a-d][0-9][0-9]', 'mgi');
  if(info.prerequisites === null) info.prerequisites = ""
  let prerequisites = document.createElement("p");
  prerequisites.className = "card-text";
  prerequisites.innerHTML = `Prerequisites: ${info.prerequisites.replace(format, replace)}`;

  let exclusions = document.createElement("p");
  exclusions.className = "card-text";
  exclusions.innerHTML = `Exclusions: ${info.exclusions.replace(format, replace)}`;

  let breadths = document.createElement("p");
  breadths.className = "card-text";
  breadths.innerHTML = `Breadths: ${info.breadths}`;

  parent.append(prerequisites);
  parent.append(exclusions);
  parent.append(breadths);
}

function createOfferings(parent, code, info) {
  let utsg = document.createElement("p");
  utsg.className = "card-text";
  utsg.innerHTML = `UTSG: ${sessionToLinks(info.crawled.sessions.utsg)}`;

  let utsc = document.createElement("p");
  utsc.className = "card-text";
  utsc.innerHTML = `UTSC: ${sessionToLinks(info.crawled.sessions.utsc)}`;

  let utm = document.createElement("p");
  utm.className = "card-text";
  utm.innerHTML = `UTM: ${sessionToLinks(info.crawled.sessions.utm)}`;

  parent.append(utsg);
  parent.append(utsc);
  parent.append(utm);
}

function createInstructors(parent, code, info) {
  let utsg = document.createElement("p");
  utsg.className = "card-text";
  Promise.all(uoftprofsFetch(info.crawled.profs.utsg, 'S', code))
    .then(response => utsg.innerHTML = `UTSG: ${response.join(', ')}`)
    .catch(err => console.error(err));

  let utsc = document.createElement("p");
  utsc.className = "card-text";
  utsc.innerHTML = `UTSC: ${info.crawled.profs.utsc.join(', ')}`;

  let utm = document.createElement("p");
  utm.className = "card-text";
  Promise.all(uoftprofsFetch(info.crawled.profs.utm, 'M', code))
    .then(response => utm.innerHTML = `UTM: ${response.join(', ')}`)
    .catch(err => console.error(err));

  //commented out bit looks too ugly TODO: make not ugly

  // let credit = document.createElement('p');
  // credit.innerText = "Official U of T course evaluations data. Analysis provided by uoftprofs.com";
  // credit.className = 'card-text text-secondary';

  // parent.append(credit);
  parent.append(utsg);
  parent.append(utsc);
  parent.append(utm);
}

function uoftprofsFetch(profs, campus, code) {
  let promises = [];
  profs.forEach(prof => {
    promises.push(new Promise(resolve => {
      // fetchResource(`https://uoft-course-info.firebaseio.com/profs/${campus}${prof.split(' ').join('')}.json`)
      //   .then(response => resolve(proflink(prof, response, code, campus)))
      //   .catch(err => {
      //     console.error(err);
      //     resolve(prof);
      //   })
      resolve(prof)
    }))
  });

  return promises;
}

function proflink(prof, fullname, code, campus) {
  if (fullname === null) return prof;
  else {
    let link = document.createElement("a");
    link.setAttribute('href', 'http://uoftprofs.com/?'
      + $.param({
        campus: campus === 'S' ? 'St. George' : 'Mississauga',
        course: code.toUpperCase(),
        instructor: fullname.name
      }));
    link.className = 'cinfo-link';
    link.innerText = fullname.name;
    return link.outerHTML;
  }
}

function createCard(code, info) {
  let card = document.createElement("div");
  card.className = "card";
  card.setAttribute("style", "margin-bottom: 0");

  let body = document.createElement("div");
  body.className = "card-body";

  let extension_label = document.createElement("div");
  extension_label.className = "card-footer";

  let extension_text = document.createElement("small");
  extension_text.className = "text-muted";
  extension_text.appendChild(document.createTextNode("Provided by UofT Course Info Extension. Not affiliated with University of Toronto or Google."));

  const feedback = document.createElement('a');
  feedback.setAttribute("style", "float: right; color: mediumvioletred");
  feedback.setAttribute("href", "https://forms.gle/eBBmuiywqHjiM8aE8");
  feedback.appendChild(document.createTextNode("Feedback :)"));
  extension_text.appendChild(feedback);


  let content = document.createElement("div");
  content.className = "tab-content";

  let first = true;
  [
    {n: "overview", f: createOverview},
    {n: "requirements", f: createRequirements},
    {n: "offerings", f: createOfferings},
    {n: "instructors", f: createInstructors}

  ].forEach(obj => {
    let tab = document.createElement("div");
    obj.f(tab, code, info);
    let tab_class = "tab-pane";
    if (first) tab_class += " show active";
    tab.className = tab_class;
    tab.setAttribute("aria-labelledby", obj.n + "-tab");
    tab.setAttribute("id", obj.n);
    tab.setAttribute("role", "tabpanel");
    first = false;
    content.append(tab);
  });


  card.append(createHeader(code, info.name, info.department));
  body.append(content);
  card.append(body);
  card.append(extension_label);
  extension_label.append(extension_text);
  return card;

}

function replace(match) {
  return `<span class="corInf ${match}" data-title="${match}"  data-code="${match}">${match}</span>`;
}