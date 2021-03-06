export const grid_replace_regex = /\|grid(\!|\?)*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g;

export function firstFun(event) {
  event.preventDefault();
}
export function toggle_grid(event) {
  event.preventDefault();
  let element = event.target;
  let id_regex = /(^.*?)(_sm)?(_.*$)/;
  let tmp = element.id.match(id_regex);
  // tmp MUST match!!!
  if (!tmp) {
    console.error("ERROR in [grid] toggle_grid!!!  Bad element id!\n", element);
    return;
  }
  let otherid = tmp[2] ? tmp[1] + tmp[3] : tmp[1] + "_sm" + tmp[3];
  let otherElement = document.getElementById(otherid);
  otherElement.checked = element.checked;

  element.form.value[otherElement.name] = element.form.value[element.name];
}

function buildHtml(grid_obj) {
  let grid_head =
    '<div class="d-flex align-items-center border"><div class="col">Select an answer for each row below:</div>';
  grid_obj.responses.forEach((resp) => {
    grid_head += `<div class="col-1">${resp.text}</div>`;
  });
  grid_head += "</div>";
  let grid_table_body = "";
  grid_obj.questions.forEach((question) => {
    
    let displayif = question.displayif ? ` displayif="${question.displayif}"` : '';

    grid_table_body += `<div id="${question.id}" ${displayif} gridrow class="d-flex align-items-stretch"><div class="col d-flex align-items-center justify-content-center border">${question.question_text}</div>`;
    grid_obj.responses.forEach((resp, resp_indx) => {
      grid_table_body += `<div class="col-1 d-flex align-items-center justify-content-center border"><input gridcell type="${resp.type}" name="${question.id}" id="${question.id}_${resp_indx}" value="${resp.value}" grid class="grid-input-element show-button"/></div>`;
    });
    grid_table_body += "</div>";
  });

  let small_format = "";
  grid_obj.questions.forEach((question) => {
    small_format += `<div id="${question.id}_sm"><div class="py-4">${question.question_text}</div>`;
    grid_obj.responses.forEach((resp, resp_indx) => {
      small_format += `<div class="text-center"><input type="${resp.type}" grid class="d-none grid-input-element" name="${question.id}_sm" id="${question.id}_sm_${resp_indx}" value="${resp.value}"/><label class="w-100" for="${question.id}_sm_${resp_indx}">${resp.text}</label></div>`;
    });
    small_format += "</div>";
  });
  let gridPrompt = "hardedit='false' softedit='false'";

  if (grid_obj.prompt){
    if (grid_obj.prompt === '!'){
      gridPrompt = "hardedit='true' softedit='false'";
    }
    else if (grid_obj.prompt === '?'){
      gridPrompt = "hardedit='false' softedit='true'";
    }
  }
  //remove , from display if for form if it exists
  grid_obj.args = grid_obj.args.replace(",displayif"," displayif");
  let html_text = `<form ${grid_obj.args} class="container question" grid ${gridPrompt}>
  ${grid_obj.shared_text}<div class="d-none d-lg-block" redertypegrid style="background-color: rgb(193,225,236)">
  ${grid_head}${grid_table_body}</div><div class="d-lg-none">${small_format}</div>
  <div class="container">
    <div class="row">
      <div class="col-lg-5">
        <input type='submit' class='previous' value='BACK'/>
      </div>
      <div class="col-lg-6">
        <input type='submit' class='reset' value='RESET ANSWER'/>
      </div>
      <div class="col-lg-1">
        <input type='submit' class='next' value='NEXT'/>
      </div>
    </div>
  </div>
  </form>`;

  //for some reason spacing needs to be removed
  return html_text.replace(/(\r\n|\n|\r)/gm, "");;
}

// note the text should contain the entirity of ONE grid!
// the regex for a grid is /\|grid\|([^|]*?)\|([^|]*?)\|([^|]*?)\|
// you  can use the /g and then pass it to the function one at a time...
export function parseGrid(text) {
  let grid_obj = {};
  //  look for key elements of the text
  // |grid|id=xxx|shared_text|questions|response|
  let grid_regex = /\|grid(\!|\?)*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/;
  let grid_match = text.match(grid_regex);
  if (grid_match) {
    grid_obj = {
      original: grid_match[0],
      prompt: grid_match[1],
      args: grid_match[2],
      shared_text: grid_match[3],
      question_text: grid_match[4],
      shared_response: grid_match[5],
      questions: [],
      responses: [],
    };
    //need to account for displayif 
    //let question_regex = /\[([A-Z][A-Z0-9_]*)\](.*?);\s*(?=[\[\]])/g;     
    let question_regex = /\[([A-Z][A-Z0-9_]*)(,displayif=.*?\(([A-Z_][A-Z0-9_#]*),.*?\))*\](.*?);\s*(?=[\[\]])/g;
    let question_matches = grid_obj.question_text.matchAll(question_regex);

    for (const match of question_matches) {
      let displayIf = '';
      if (match[2]){
        displayIf = match[2].replace(",displayif=","");
      }
      let question_obj = { id: match[1], question_text: match[4], displayif: displayIf };
      grid_obj.questions.push(question_obj);
    }

    let rb_cb_regex = /([\[\(])(\w+):([^\]\)]+)[\]\)]/g;
    let response_matches = grid_obj.shared_response.matchAll(rb_cb_regex);
    if (response_matches) {
      for (const match of response_matches) {
        grid_obj.responses.push({
          is_radio: match[1] == "(",
          type: match[1] == "(" ? "radio" : "checkbox",
          value: match[2],
          text: match[3],
        });
      }
    }
  }
  return buildHtml(grid_obj);
}
