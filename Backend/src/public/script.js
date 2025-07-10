const createCookie = document.getElementById('crear-cookie')

createCookie.addEventListener('click', async()=>{
    const name= document.getElementById('name').value
    const modo= document.getElementById('modo').value
    await fetch('http://localhost:8080/cookie',{
        method: 'POST',
        body:JSON.stringify({name, modo}),
        headers:{
            'Content-Type':'application/json'
        }
    })
})