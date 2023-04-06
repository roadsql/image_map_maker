function get_params(query_string) {
    if (!query_string) {
      query_string = window.location.search
    }
    const url_params_array = query_string.split("?").join("").split("&")
    const url_params = {}
  
    for (let x = 0; x < url_params_array.length; x++) {
      // returns the params from the url as an object
      const temp = url_params_array[x].split("=")
      url_params[decodeURI(temp[0])] = decodeURI(temp[1])
    }
    return url_params
  }
  
  function tag(id){
    return document.getElementById(id)
}

async function server_post(payload) {
  
    let url =  `https://script.google.com/macros/s/${deployment_id}/exec`
    console.log("url", url)
    console.log("payload", payload)
    const reply = await fetch(url, {
      method: `POST`,
      body: JSON.stringify(payload),
    })
    const data=await reply.text()
    console.log("data",data)
    return data
}
