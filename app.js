const BASE_URL = "https://api.harvardartmuseums.org"; // API
const KEY = "apikey=19552f90-b2fb-11ea-8bfd-6d81a20286fa"; // PERSONAL KEY

//MAIN FETCH FUNCTION
async function fetchObjects() {
  const url = `${BASE_URL}/object?${KEY}`; //brings data in from API
  try {
    const response = await fetch(url); //fetches the data
    const data = await response.json(); //waits for data
    console.log(data);
    return data; //returns data
  } catch (error) {
    console.error(error); //console log error
  }
}

//FETCH START
function onFetchStart() {
  $("#loading").addClass("active");
}

//FETCH END
function onFetchEnd() {
  $("#loading").removeClass("active");
}

//FETCHING CENTURIES
async function fetchAllCenturies() {
  const url = `${BASE_URL}/CENTURY?${KEY}&size=100&sort=temporalorder`;
  if (localStorage.getItem("centuries")) {
    return JSON.parse(localStorage.getItem("centuries"));
  }
  try {
    const response = await fetch(url);
    const { records } = await response.json();
    localStorage.setItem("centuries", JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
    // onFetchStart();
  }
}
fetchAllCenturies();

//FETCHING CLASSIFICATIONS
async function fetchAllClassification() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;
  if (localStorage.getItem("classification")) {
    return JSON.parse(localStorage.getItem("classification"));
  }
  try {
    const response = await fetch(url);
    const { records } = await response.json();
    localStorage.setItem("classification", JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
    // onFetchStart();
  }
}
fetchAllClassification();

//PREFETCH CATEGORY LIST FUNCTION
async function prefetchCategoryLists() {
  try {
    const [classifications, centuries] = await Promise.all([
      fetchAllClassification(),
      fetchAllCenturies(),
    ]);

    $(".classification-count").text(`(${classifications.length})`);
    classifications.forEach((classification) => {
      $("#select-classification").append(
        $(`<option value="${classification.name}">${classification.name}</option>`)
      );
    });

    $(".century-count").text(`(${centuries.length})`);
    centuries.forEach((century) => {
      $("#select-century").append($(`<option value="${century.name}">${century.name}</option>`));
    });
  } catch (error) {
    console.error(error);
  }
}
prefetchCategoryLists();

//BUILD SEARCH STRING
function buildSearchString() {
  const classification = $("#select-classification").val();
  const century = $("#select-century").val();
  const keywords = $("#keywords").val();
  return `${BASE_URL}/object?${KEY}&classification=${classification}&CENTURY=${century}&keyword=${keywords}`;
}

//SEACH CLICK FUNCTION
$("#search").on("submit", async function (event) {
  event.preventDefault();
  onFetchStart();
  try {
    const response = await fetch(buildSearchString());
    const { records, info } = await response.json();
    console.log(records, info);
    updatePreview(records, info);
    return records, info;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

//RENDER PREVIEW
function renderPreview(record) {
  const { description, primaryimageurl, title } = record;
  recordElement = $(`
    <div class="object-preview">
        <a target="_blank" href="${primaryimageurl}">
            ${primaryimageurl ? `<img src="${primaryimageurl}" />` : ""}
            ${title ? `<h3>${title}</h3>` : ""}</a>
            ${description ? `<h3>${description}</h3>` : ""}
    </div>`).data("record", record);
  return recordElement;
}

//PAGINATION
function updatePreview(records, info) {
  const root = $("#preview");
  let results = root.find(".results").empty();
  console.log(info.next)
  if (info.next) {
    $(".next").data("url", info.next);
    $(".next").attr("disabled", false);
  } else {
    $(".next").data(null);
    $(".next").attr("disabled", true);
  }
  if (info.prev) {
    $(".previous").data("url", info.prev);
    $(".previous").attr("disabled", false);
  } else {
    $(".previous").data(null);
    $(".previous").attr("disabled", true);
  }
  $(".results").empty();
  records.forEach(function (record) {
    results.append(renderPreview(record));
  });
}

//PAGINATION CLICK FUNCTION
$("#preview .next, #preview .previous").on("click", async function () {
  onFetchStart();
  try {
    const url = $(this).data("url");
    const response = await fetch(url);
    const { records, info } = await response.json();
    updatePreview(records, info);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

//MAIN FEATURE PREVIEW CLICK FUNCTION
$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault();
  const preview = $(this).closest(".object-preview");
  const record = preview.data('record');
  const feature = $("#feature");
  console.log(record, preview)
  renderFeature(record);
});

//RENDER MAIN FEATURE 
function renderFeature(record) {
  const { images, person, primaryimageurl, title, dated, description, style, technique, medium, dimensions, people, department, division, contact, creditline } = record;
  const feature = $("#feature");
  return feature.append($(`<div class="object-feature">
  <header>
    <h3>${title}</h3>
    <h4>${dated}</h4>
  </header>
  <section class="facts">
   ${factHTML("Style", style)}<br>
   ${factHTML("Description", description)}<br>
   ${factHTML("Technique", technique, "technique")}<br>
   ${factHTML("Medium", medium, "medium")}<br>
   ${factHTML("Dimensions", dimensions)}<br>
   ${factHTML("Department", department)}<br>
   ${factHTML("Division", division)}<br>
   ${factHTML("Contact", contact)}<br>
   ${factHTML("Creditline", creditline)}<br>
   ${factHTML("Content", `<a target="_blank" href="mailto:${contact}">${contact}</a>`)}<br>
   ${people ? people.map(function (person) {
    return factHTML("Person", person, "person");
  }).join("") : ""}
  </section>
  <section class="photos">
  ${ photosHTML(images, primaryimageurl)}
  </section>`
  ));
}

//FEATURE CLICK FUNCTIONS FOR ANCHOR TAGS
$("#feature").on("click", "a", async function (event) {
  const tag = $(this).attr("href");
  if (href.startsWith('mailto')) { return; };
  event.preventDefault();
  onFetchStart();
  $(".object-feature").append(tag);
  onFetchEnd();
})

//SEARCH STRING
function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

//FACT FUNCTION
function factHTML(title, content, searchTerm = null) {
  if (!content) {
    return '';
  }
  return `<span class=${title}>${title}</span>
  <span class="content">${ content && searchTerm ? `<a href=${searchURL(searchTerm, encodeURI(content))}>${content}</a>` : content}</span>`;
}

//PHOTO FUNCTION
function photosHTML(images, primaryimageurl) {
  if (images & images.length > 0) {
    return images.map(image =>
      `<img src="${image.baseimageurl}/>`.join('')
    )
  } else if (primaryimageurl) {
    return `<img src="${primaryimageurl}" />`
  } else {
    return ''
  }
}

