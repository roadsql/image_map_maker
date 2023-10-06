let current_table
let current_link
let current_point
let sheet_data
const tables=[]
const links=[]
let sheet_id
function add_spans(text){
    return "<span>" + text.split("").join("</span><span>") + "</span>"
}

function get_wrapped_text(div){
    console.log(div)
    const letters=[]
    let top=0
    for(const letter of div.querySelectorAll("span")){
        if(top !== letter.offsetTop){
            if(letters.length > 0 && letters[letters.length-1]){letters.pop()}
            letters.push("\n")
            top=letter.offsetTop
        }
        letters.push(letter.innerHTML)
    }
    letters.shift()
    return letters.join("")

}

function build_wrapped_note(name, note, title){
    //builds a div to be able to get the note telemetry with wraps
    const div = document.createElement("div");
    div.id="note-"+name
    div.className="note"
    div.innerHTML = add_spans(note)
    document.getElementById("notes").appendChild(div);
    div.dataset.title=btoa(title)
    div.innerHTML=get_wrapped_text(div)
}

function start_me_up_svg(){
    console.log("starting")
    const url_params= get_params()
    console.log("params",url_params)
    console.log('url_params("sheet")', url_params["sheet"])
    sheet_id=sheets[url_params["sheet"]].id
    console.log("sheet_id", sheet_id)
    console.log("sheets", sheets)
    fetch(`https://script.google.com/macros/s/${deployment_id}/exec?mode=svg-data&sheetId=${sheet_id}`)
    .then((response) => response.json())
    .then((data) => {
        
        sheet_data = data
        console.log("data",data)
     
        // build the tiles for making the diagram.  this will allow us to see screen dimensions
        for(const table of data.tables){
            const field_names=[]
            build_wrapped_note(table.name, table.note, "Table: " + table.name)
            for(const field of table.fields){
                build_wrapped_note(table.name+"-"+field.name, field.note, field.name + ": " + field.type)

                if(field.pk){
                    field_names.push("<b>" + field.name + "</b>")
                }else{
                    field_names.push(field.name)                
                }
                
            }
            const newTable = document.createElement(`div`)
            newTable.id=table.name+"-div"
            newTable.innerHTML = `<div class="relation-head">${table.name}</div><div class="relation-body">${field_names.join("<br>")}</div>`
            newTable.className="relation"
            tag("canvas").appendChild(newTable)
            console.log(table.name,"width", newTable.clientWidth)
            
        }
        // now build the svg 
        const svg=[]

        const uses=[]

        const margin = 10
        const table_name_height = 26
        const field_name_height = 18
        let left=margin
        let top=margin
        let max_height=0
        let max_width=0
        
        // put the links on the lowest level of the svg 


        for(const link of data.links){
            svg.push(svg_path(link.path))                    
        }

        for(const table of data.tables){
            if(table.position.left){left=table.position.left}
            if(table.position.top){top=table.position.top}
            console.log(table.name, top, left)
            const table_width=tag(table.name+'-div').clientWidth
            const id = table.name
            if(left+table_width>max_width){
                max_width = left+table_width
            }
            svg.push(svg_textbox(id, top, left, table_name_height, table_width, id,"table", "center"))
            //uses.push(svg_place_object(id, margin, left))            
            const field_names=[]
            let field_top=top+table_name_height
            for(const field of table.fields){
                let class_name="field"
                if(field.pk){
                    class_name="key " + class_name
                }

                svg.push(svg_textbox(id + "-" +field.name, field_top, left, field_name_height, table_width, field.name, class_name, "5", "white"))
                //uses.push(svg_place_object(id + "-" + field.name, field_top, left))            
                field_top = field_top + field_name_height
                if(field_top>max_height){
                    max_height = field_top
                }
            }
            left=left + margin + table_width

        }




        console.log(tables)

        svg.unshift(`<svg id="diagram" xmlns="http://www.w3.org/2000/svg" height="${max_height+margin}"width="${max_width+margin}" style="background-color:whitesmoke">
        <style>
            .table {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 14px;
                font-weight:bold;
                fill:white;
            }
            .field{
                font-family: Arial, Helvetica, sans-serif;
                font-size: 12px;
                fill:#444;
            }
            .key{
                font-weight:bold;
            }
            .table-box{
                fill:#316896;
                stroke:none;
            }
            .field-box{
                fill:white;
                stroke:none;
            }
            .field-hover{
                fill:black;
                opacity:0;
                cursor:pointer;
            }
            .field-hover:hover{
                opacity:.1;
            }
            .table-hover{
                fill:white;
                opacity:0;
                cursor:pointer;
            }
            .table-hover:hover{
                opacity:.4;
            }
            .text {
                display: none;
                fill:darkgreen;
                cursor:pointer;
            }

            .link{
                opacity: 0;
                cursor:pointer;
                stroke:#555;
            }
            .link:hover{
                opacity: 0.3

            }
            .dd:hover .text {
                display: block;
            }
            .info{
                fill:white;
            }
        </style>

        `)
        //svg.push("</defs>")
        svg.push(uses.join("\n"))
        svg.push("</svg>")

        tag("svg-div").innerHTML = svg.join("\n")
    })

  tag("path").focus()  
    
}
function svg_place_object(id, top, left){
    //returns svg xml place an object at a location
    return `<use xlink:href="#${id}" x="${left}" y="${top}" />`
}

function tag(id){
    return document.getElementById(id)
}
function svg_polyline(linkLine){
    //returns the svg xml to place a polyline
    return`
      <polyline points="${linkLine}" fill="none"  stroke-width="1" stroke="#555" stroke-linejoin="round"/>
      <polyline points="${linkLine}" fill="none"   stroke-width="7" onclick="console.log('linking')" class="link"/>
    
    `

}
function svg_path(path){
    if(!path){return ""}
    //returns the svg xml to place a polyline
    return`
      <path  d="${path}" fill="none"  stroke-width="1" stroke="#555" stroke-linejoin="round"/>
      <path  d="${path}" fill="none"   stroke-width="7" onclick="console.log('linking')" class="link"/>
    
    `

}
function svg_textbox(id, top, left, height, width, text, class_name, indent="center"){
    // returns the svg xml to build a group that has a text in a box
    //if indent is numeric, it will indicate how much to indent from left
    let offset="50%"
    let anchor="middle"
    if(indent!=="center"){
        offset=indent
        anchor="left"
    }
    return `
    <rect x="${left}" y="${top}" class="${class_name}-box" width="${width}" height="${height}"/>
    <path id="${id}_path"  d="M${left} ${top+(height/2)}h${width}"/>
    <text class="${class_name}">
      <textPath href="#${id}_path" startoffset="${offset}" text-anchor="${anchor}"
      dominant-baseline="middle" >${text}</textPath>
    </text>
    <g class="dd">
      <rect x="${left}" y="${top}" class="${class_name}-hover" width="${width}" height="${height}" onclick="console.log('modify query')" /> 
      <g onclick="d(event,'${id}')" class="text">
      <circle cx="${left+width}" cy="${top+(height/2)}"  r="6" data-height="${tag("note-"+id).clientHeight}" data-width="${tag("note-"+id).clientWidth}"  data-title="${tag("note-"+id).dataset.title}" data-text="${btoa(tag("note-"+id).innerHTML)}"/>
      <circle cx="${left+width}" cy="${top+(height/2)-3}" class="info"  r="1.2"/>
      <rect x="${left+width-1}" y="${top+(height/2)-1}" width="2" height="5" class="info" />
      </g>
    </g>
    `
    
}


function d(evt, id){
    // diagram click.  It's name is short to keep the size of the svg small
    console.log(evt.target.parentElement.parentElement.firstElementChild.width.baseVal.value, id)
    const mask=evt.target.parentElement.parentElement.firstElementChild
    const y = mask.y.baseVal.value
    
    let elem=evt.target
    console.log("elem",elem.tagName)
    while (elem.tagName !== 'g'){
        elem=elem.parentElement
    }
    elem=elem.firstElementChild
    
    console.log("elem",elem)
    const title = atob(elem.dataset.title)
    const note = atob(elem.dataset.text)
    const note_width = parseFloat(elem.dataset.width)-8
    console.log("note_width", note_width)


    elem=evt.target
    while (elem.tagName !== "svg"){
        elem=elem.parentElement
    }


    for(const part of elem.querySelectorAll(".added-svg")){
        part.remove()
    }


    console.log(elem.width.baseVal.value)
    const image_width = elem.width.baseVal.value
    const image_height = elem.height.baseVal.value
    const mask_left = mask.x.baseVal.value
    const mask_right = mask_left + mask.width.baseVal.value
    
    const lines = note.split("\n")
    const header_text_size=8
    const text_size=8
    const line_spacing=10
    //const padding_top=1
    const padding_bottom=2
    const padding_left=4
    const row_height = mask.height.baseVal.value
    const border=1.3
    const corner_radius = 4
    const arrow_width=10
    const title_height=12
    const note_height=line_spacing*lines.length+padding_bottom
    const height=note_height+title_height+2*border
    const width=note_width+border*2
    
    let top=y-(height/2)+row_height-5
    
    if(top<2){
      top=2
    }else if(top + height + 4 > image_height){
        top=image_height-height-4
    }

    let left=mask_right+arrow_width-1
    let arrow_points=`${mask_right+2},${y+(row_height/2)} ${mask_right+arrow_width},${y+(row_height/2)-4} ${mask_right+arrow_width},${y+(row_height/2)+4}`
    if(left+width > image_width){
        left=mask_left-arrow_width-width-1
        arrow_points=`${mask_left-2},${y+(row_height/2)} ${mask_left-arrow_width},${y+(row_height/2)-4} ${mask_left-arrow_width},${y+(row_height/2)+4}`
    }
    
    
    let shp

    shp = document.createElementNS('http://www.w3.org/2000/svg','polygon');  
    shp.setAttribute('fill', 'darkgreen');
    shp.classList.add('added-svg');
    shp.setAttribute('points',arrow_points);
    shp.setAttribute('style',"fill:darkgreen;stroke:none;");
    elem.appendChild(shp);
   
    shp = document.createElementNS('http://www.w3.org/2000/svg','rect');
    shp.setAttribute('fill', 'darkgreen');
    shp.classList.add('added-svg');
    shp.setAttribute('y',top);
    shp.setAttribute('x',left);
    shp.setAttribute('rx',corner_radius);
    shp.setAttribute('height',height+(border*2));
    shp.setAttribute('width',width+(border*2));
    elem.appendChild(shp);

    shp = document.createElementNS('http://www.w3.org/2000/svg','rect');
    shp.setAttribute('fill', 'white');
    shp.classList.add('added-svg');
    shp.setAttribute('y',top+border+title_height);
    shp.setAttribute('x',left+border);
    shp.setAttribute('rx',corner_radius-1);
    shp.setAttribute('height',height-title_height);
    shp.setAttribute('width',width);
    elem.appendChild(shp);

    shp = document.createElementNS('http://www.w3.org/2000/svg','rect');
    shp.setAttribute('fill', 'white');
    shp.classList.add('added-svg');
    shp.setAttribute('y',top+border+title_height);
    shp.setAttribute('x',left+border);
    shp.setAttribute('height',corner_radius);
    shp.setAttribute('width',width);
    elem.appendChild(shp);
  
  
    shp = document.createElementNS('http://www.w3.org/2000/svg','text');
    shp.setAttribute('fill', 'white');
    shp.classList.add('added-svg');
    shp.setAttribute('y',top+border+header_text_size);
    shp.setAttribute('x',left + border +padding_left);
    shp.setAttribute('font-size',header_text_size);
    shp.innerHTML=title
    elem.appendChild(shp);
    
    
    for(let x=0;x<lines.length;x++){
        
        shp = document.createElementNS('http://www.w3.org/2000/svg','text');
        shp.setAttribute('fill', '#444');
        shp.classList.add('added-svg');
        shp.setAttribute('y',top+border+title_height+((1+x)*line_spacing));
        shp.setAttribute('x',left + border+padding_left);
        shp.setAttribute('font-size',text_size);
        shp.innerHTML=lines[x]
        elem.appendChild(shp);
    }
  
    shp = document.createElementNS('http://www.w3.org/2000/svg','circle');
    shp.setAttribute('fill', 'darkgreen');
    shp.classList.add('added-svg');
    shp.setAttribute('cy',top+border+6);
    shp.setAttribute('cx',left + width - border -5);
    shp.setAttribute('r',5);
    shp.setAttribute('cursor',"pointer");
    shp.setAttribute('onclick','close_note(event)')
    elem.appendChild(shp);

    shp = document.createElementNS('http://www.w3.org/2000/svg','text');
    shp.setAttribute('fill', 'white');
    shp.classList.add('added-svg');
    shp.setAttribute('y',top+border+header_text_size+1);
    shp.setAttribute('x',left + width - border -8);
    shp.setAttribute('font-size',9);
    shp.setAttribute('cursor',"pointer");
    shp.setAttribute('font-weight',"bold");
    shp.setAttribute('onclick','close_note(event)')
    shp.innerHTML="X"
    elem.appendChild(shp);


}

function close_note(evt){
    console.log(evt)
    let elem=evt.target
    while (elem.tagName !== "svg"){
        console.log(elem)
        elem=elem.parentElement
    }
    for(const part of elem.querySelectorAll(".added-svg")){
        part.remove()
    }

}
function show_cursor_position(evt){
    tag("coordinates").innerHTML=`${evt.offsetX},${evt.offsetY}`
    const dx=evt.offsetX-(tag("path").dataset.x)
    const dy=evt.offsetY-(tag("path").dataset.y)
    tag("delta-coordinates").innerHTML=`${dx},${dy}`
}

function trap_keys(evt){
    //console.log(evt, evt.key)
    if(evt.target.value.length===0){evt.target.dataset.priorMove = 0}//reset
    const[x,y, dx, dy, prior] = get_coords()
    const radius=3
    let steps
    let adjustment
    let this_sign
    let prior_sign = "";if(prior<0){prior_sign="-"}
    switch(evt.key){
        case "M":
            append(evt.key+x+","+y )
            new_x(x)
            new_y(y)
            evt.preventDefault()
            break
        case "m":
            append(evt.key+dx+","+dy )
            new_x(x)
            new_y(y)
            evt.preventDefault()
            break
        case "L":
            append(evt.key+x+","+y )
            new_x(x)
            new_y(y)
            evt.preventDefault()
            break
        case "l":
            append(evt.key+","+dx+","+dy )
            new_x(x)
            new_y(y)
            evt.preventDefault()
            break
        case "h":
            this_sign = "";if(dx<0){this_sign="-"}
            console.log("Prior",prior)
            adjust_for_radius(evt.target)
            adjustment = radius * (dx/Math.abs(dx)) * Math.abs(prior)
            steps=[evt.key+(dx-adjustment)]
            if(prior!==0){
              steps.unshift(`a${radius},${radius} 0 0 ${((prior*(dx/Math.abs(dx)))-1)/-2} ${this_sign}${radius},${prior_sign}${radius} `)
            }

            append(...steps)

            if(x>parseInt(evt.target.dataset.x)){
                evt.target.dataset.priorMove = 1
            }else{
                evt.target.dataset.priorMove = -1
            }
            console.log("adjustment",adjustment)
            new_x(x)
            evt.preventDefault()
            break
        case "v":
            
            this_sign = "";if(dy<0){this_sign="-"}
            adjust_for_radius(evt.target)
            adjustment = radius * (dy/Math.abs(dy)) * Math.abs(prior)
            steps=[evt.key+(dy-adjustment)]
            if(prior!==0){
                steps.unshift(`a${radius},${radius} 0 0 ${((prior*(dy/Math.abs(dy)))+1)/2} ${prior_sign}${radius},${this_sign}${radius} `)
            }
              append(...steps)
            if(y>parseInt(evt.target.dataset.y)){
                evt.target.dataset.priorMove = 1
            }else{
                evt.target.dataset.priorMove = -1
            }
            new_y(y)
            evt.preventDefault()
            break


        default:    
    }   
    
    function new_x(x){
        evt.target.dataset.x=x
    }
    function new_y(y){
        evt.target.dataset.y=y
    }
    function append(){
        let args = Array.from(arguments)
        

        evt.target.value=evt.target.value + " " + args.shift() + args.join(" ")
        console.log(args)
    }
    function get_coords(){
        const coords=tag("coordinates").innerHTML.split(",")
        const x = parseInt(coords[0])
        const y =parseInt(coords[1])
        const old_x=parseInt(evt.target.dataset.x)
        const old_y=parseInt(evt.target.dataset.y)
        return [x,y,x-old_x,y-old_y, parseInt(evt.target.dataset.priorMove)]
    }
    function adjust_for_radius(){ 
        //reduce the length of hte last line by the radius
        if(prior===0){return}// no prior line
        const a=evt.target.value.split("")
        const digits=[]
        for(let x=0;x<a.length;x++){
            const digit = a.pop()
            if(isNaN(digit)){
                a.push(digit)
                break
            }
            digits.unshift(digit)
        }
        console.log("digits", digits)
        a.push(parseInt(digits.join(""))-radius)
        
        evt.target.value=a.join("")
    }
}