// for production, there needs to be a file like this with the actual 
// ids to refererence the correct google apps script endpoint and 
// sheet it.  name it config.js and be sure it is gitignore
function start_me_up(){
    // build the selector
    
    const html=['sheet id:<select id="sheet-id">']
    for(const [key, val] of Object.entries(sheets)){
        html.push(`<option value="${key}">${val.name}</option>`)
    }
    html.push("</select><br>")
    html.push('<button onclick="svg_maker()">svg Maker</button> ')
    html.push('<button onclick="map_maker()">Map Maker</button> ')
    html.push('<button onclick="sqlite()">SQLite data</button> ')
    html.push('<button onclick="make_csvs()">CSV</button> ')
    html.push('<button onclick="make_oracle()">Create Table SQL</button> ')
    tag("control").innerHTML=html.join("")
}

function map_maker(){
    window.open("image_map_maker.html?sheet="+tag("sheet-id").value, "_blank");
}function svg_maker(){
    window.open("svg_maker.html?sheet="+tag("sheet-id").value, "_blank");
}

async function sqlite(){
 const response = await server_post({
     mode:"sqlite",
     sheetId: sheets[tag("sheet-id").value].id
 })
 document.body.innerHTML = response
}

async function make_oracle(){
 const response = await server_post({
     mode:"oracle",
     sheetId: sheets[tag("sheet-id").value].id
 })
 document.body.innerHTML = `<pre>${response}</pre>`
}


async function get_csv_list(){
    const response = await server_post({
        mode:"csv-list",
        sheetId: sheets[tag("sheet-id").value].id
    })
    return response
}   

async function make_csvs(){
    const csv_list = JSON.parse(await get_csv_list())
    const data=[]
    for(const sheet of csv_list.sheets){
        console.log(sheet)
        const filename = `${csv_list.schema}-${sheet.sheetName.split("_").join("-")}-csv`
        download_one_csv(sheet.url, filename)
        data.push(`{ "text": "Inserting ${sheet.sheetName} data...", "file": "${filename}", "type": "csv", "user":"${csv_list.schema}", "table":"${sheet.sheetName}"},`)
    }
    document.body.innerHTML = data.join("<br>")
}   

async function download_one_csv(url, filename){

    const response = await fetch(url);
    const data = await response.text();
    const data_array=data.split("\n")
    data_array.shift()
    data_array.shift()
    data_array.shift()
    data_array.shift()
    download(filename.replaceAll("_","-"),data_array.join("\n"))
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
