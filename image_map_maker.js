let current_table
let current_link
let current_point
let sheet_data
const tables=[]
const links=[]
let sheet_id
function start_me_up(){
    const url_params= get_params()
    console.log("params",url_params)
    console.log('url_params("sheet")', url_params["sheet"])
    sheet_id=sheets[url_params["sheet"]].id
    console.log("sheet_id", sheet_id)
    console.log("sheets", sheets)
    fetch(`https://script.google.com/macros/s/${deployment_id}/exec?mode=diagram-data&sheetId=${sheet_id}`)
    .then((response) => response.json())
    .then((data) => {
        sheet_data = data
        console.log(data[0][1])
        tag("image-div").innerHTML=`<img src="${data[0][1]}" onclick="image_click(event)">`
        const html=[`<table style=" border-collapse: collapse;"><tr><th>Table</th><th>Top</th><th>Left</th><th>Field Top</th><th>Bottom</th><th>right</th></tr>`]
        for(let x=1;x<data[1].length;x++){

            if(data[1][x]){
                const table=JSON.parse(data[1][x])
                table.column=x
                tables.push(table)
                html.push(`<tr onclick="set_table(this)" id="${table.name}"><td>${table.name}</td><td class="f1">${table.points.top}</td><td class="f1">${table.points.left}</td><td class="f2">${table.points.fieldTop}</td><td class="f3">${table.points.bottom}</td><td class="f3">${table.points.right}</td></tr>`)
            }
        }
        html.push("</table><br>")
        html.push(`<table style=" border-collapse: collapse;"><tr><th>Link</th><th>coordinates</th></tr>`)
        for(let x=1;x<data[2].length;x++){

            if(data[2][x]){
                const link=JSON.parse(data[2][x])
                link.column=x
                links.push(link)
                console.log("link",link)
                html.push(`<tr onclick="set_link(event, this)"><td>${link.name}</td><td id="link-${link.column}" class="f">${link.points.join(", ")}</td></tr>`)
            }
        }
        html.push('</table><br><button onclick="save()">Save</button> <button onclick="build_map()">Map</button>')

        tag("task-div").innerHTML=html.join("")

        // build the tiles for making the diagram
        for(const table of tables){
            const field_names=[]
            for(const field of table.fields){
                if(field.pk){
                    field_names.push("<b>" + field.name + "</b>")
                }else{
                    field_names.push(field.name)                
                }
                
            }
            const newTable = document.createElement(`div`)
            newTable.innerHTML = `<div class="relation-head">${table.name}</div><div class="relation-body">${field_names.join("<br>")}</div>`
            newTable.className="relation"
            tag("canvas").appendChild(newTable)
            
        }
        console.log(tables)
    });
    
}

function build_map(){
    // build area map for tables and fields
    let template = '<area data-note="[NOTE]" data-kind="table" data-heading="[TITLE]" data-title="[X]" coords="[C]" shape="rect">'
    const areas=['<map name="image-map">']
    let area
    for(const table of tables){
        const head_size = (table.points.fieldTop - table.points.top)
        console.log(table.name, table)
        area=template.replaceAll("[X]", table.name)
        area=area.replace("[TITLE]", "Table " + table.name)
        area=area.replace("[NOTE]", table.note)
        area=area.replace("[C]", table.points.left + ",[C]")
        area=area.replace("[C]", table.points.top + ",[C]")
        area=area.replace("[C]", table.points.right + ",[C]")
        area=area.replace("[C]", table.points.fieldTop)
        areas.push(area)
        let increment = table.points.fieldTop - table.points.top
        const field_size = Math.round((table.points.bottom - table.points.fieldTop)/table.fields.length)
        console.log("field_size",field_size)
        for(let f=0; f<table.fields.length; f++){
            const field = table.fields[f]
            console.log("field", f, field)
            const field_top=(parseInt(table.points.fieldTop) + f * field_size)
            area=template.replaceAll("[X]", table.name + "." + field.name)
            area=area.replace("[TITLE]", `${field.name}: ${field.type}`)
            area=area.replace("[NOTE]", field.note.replaceAll('"','&amp;quot;'))
            area=area.replace("[C]", table.points.left + ",[C]")
            area=area.replace("[C]", field_top + ",[C]")
            area=area.replace("[C]", table.points.right + ",[C]")
            area=area.replace("[C]", field_top+field_size)
            areas.push(area)
        }
    }
    for(const link of links){
        console.log("link",link)
        const clause=`${link.fk.split(".")[0]} JOIN ${link.pk.split(".")[0]} ON ${link.fk} = ${link.pk}`
        areas.push(`<area coords="${link.points.join(",")}" shape="poly" data-note="Join the &amp;quot;${link.fk.split(".")[0]}&amp;quot; table to the &amp;quot;${link.pk.split(".")[0]}&amp;quot; table." data-kind="link" data-heading="Relationship" data-title="${clause}"></area>`)
    }
    console.log("areas", areas)
    tag("output").innerHTML = '<textarea id="html-output" style="width:100%"><img src="'+sheet_data[0][1]+'" usemap="#image-map" />' + areas.join("\n") + "\n</map></textarea>"
    tag("html-output").style.height = tag("html-output").scrollHeight + 'px'
   
}

async function save(){
    console.log("saving", sheet_data)
    for(const table of tables){
        //vconsole.log(table.name, tag(table.name).children[1].innerHTML)
        const table_data=JSON.parse(sheet_data[1][table.column])
        table_data.points.top = tag(table.name).children[1].innerHTML
        table_data.points.left = tag(table.name).children[2].innerHTML
        table_data.points.fieldTop = tag(table.name).children[3].innerHTML
        table_data.points.bottom = tag(table.name).children[4].innerHTML
        table_data.points.right = tag(table.name).children[5].innerHTML
        //console.log(table_data)
        sheet_data[1][table.column]=JSON.stringify(table_data)
    }

    for(const link of links){
        //console.log(link, sheet_data[2][link.column])
        const table_data=JSON.parse(sheet_data[2][link.column])
        table_data.points = tag("link-"+link.column).innerHTML.replace(" ","").split(",").map(Number)
 
        //console.log(table_data)
        sheet_data[2][link.column]=JSON.stringify(table_data)
    }

    console.log("saving", sheet_data)
    const response = await server_post({mode:"set-diagram-data",sheetId:sheet_id,payload:JSON.stringify(sheet_data)})
    console.log("done waiting")
    console.log("response",response)
}



function image_click(e){

    if(current_table){
        const coords=[e.offsetY,e.offsetX]
        const cells=current_table.querySelectorAll(".f"+current_point)
        for(let x=0;x<cells.length;x++ ){
            cells[x].innerHTML=coords[x]
            cells[x].style.backgroundColor=null
        }
    
        current_point++

        if(current_point > 3){
            current_table = current_table.nextElementSibling
            current_point = 1  
        } 

        console.log("current_table",current_table)

        for(const node of current_table.querySelectorAll(".f"+current_point)){
            node.style.backgroundColor="lemonchiffon"
        }
    }else if(current_link){
        const cell=current_link.querySelector(".f")
        let current_coords=cell.innerHTML
        if(current_coords){current_coords+=", "}
        current_coords+=e.offsetX + ", " + e.offsetY
        cell.innerHTML=current_coords
    }


}

function set_table(tr){
    current_link=null
    if(current_table){
        for(const node of current_table.querySelectorAll(".f"+current_point)){
            node.style.backgroundColor=null
        }
    }    



    if(!current_table){
        current_table=tr
        current_point=1
    }else if(tr.id === current_table.id){
        current_table=null
        return
    }else{
        current_table=tr
        current_point=1
    }

    for(const node of current_table.querySelectorAll(".f"+current_point)){
        node.style.backgroundColor="lemonchiffon"
    }
}


function set_link(evt, tr){
    console.log("evt",evt)


    current_table=null
    if(current_link){
      current_link.querySelector(".f").style.backgroundColor=null
    }    

    if(!current_link){
        current_link=tr
    }else if(tr === current_link){
        current_link=null
        return
    }else{
        current_link=tr
    }
    current_link.querySelector(".f").style.backgroundColor="lemonchiffon"
    current_link.querySelector(".f").innerHTML=""
}


