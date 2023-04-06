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
    html.push('<button onclick="map_maker()">Map Maker</button> ')
    html.push('<button onclick="sqlite()">SQLite data</button> ')
    tag("control").innerHTML=html.join("")
}

function map_maker(){
    window.open("image_map_maker.html?sheet="+tag("sheet-id").value, "_blank");
}

async function sqlite(){
 const response = await server_post({
     mode:"sqlite",
     sheetId: sheets[tag("sheet-id").value].id
 })
 document.body.innerHTML = response
}
