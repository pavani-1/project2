var express=require("express");
var app=express();
var port= 80;
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
const bodyParser=require('body-parser');
app.use(bodyParser.json());
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient("mongodb://localhost:27017/",{ useUnifiedTopology: true })
client.connect();
var flag=0;
const { Payload } =require("dialogflow-fulfillment");
var randomstring = require("randomstring"); 
var user_name="";
var phonenum="";


app.post("/add_data", (req, res) => {
    var myData = req.body;
    client.db("customer_information").collection("users").insertOne(myData,function(err,res){
        if(err) throw err;
    });
});




const { WebhookClient } = require("dialogflow-fulfillment");
app.post('/dialogflow-fulfillment', (request, response) => {
    dialogflowFulfillment(request, response)
})



const dialogflowFulfillment = (request, response) => {
    const agent = new WebhookClient({request, response});
    let intentMap = new Map();
    intentMap.set("Issue - custom", get_username);
    intentMap.set("Issue - custom - custom-2",add_name);
    intentMap.set("Issue - custom - custom",options);
    intentMap.set("Tokengeneration",generate_token);


    
    async function get_username(agent){
        phonenum=agent.parameters.phonenumber;
        var query = await client.db("customer_information").collection("users").findOne({phoneno:phonenum});
        if (query==null){
            await agent.add("You have not registered.Please enter your username to register!!!");
            flag=1;
        }
        else{
            flag=0;
            user_name=query.username;
            await agent.add("Hi "+user_name+"!! \n Please specify your problem!!!");
        }
    }



    async function add_name(agent){
        if(flag==1){
            var name=agent.parameters.person.name;
            user_name=name;
            client.db("customer_information").collection("users").insertOne({phoneno:phonenum,username:user_name});
            await agent.add("You are registered!!!Specify your problem");
        }
        else{
            await agent.add("You are already registered!!!Waiting for your issue!!!");
        }
    }
    function options(agent)
    {
	    var Data=
		{
            "richContent": [
            [
                {
                    "type": "list",
                    "title": "Internet Down",
                    "subtitle": "Press '1' for Internet down",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "list",
                    "title": "Slow Internet",
                    "subtitle": "Press '2' for Slow Internet",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "list",
                    "title": "Buffering problem",
                    "subtitle": "Press '3' for Buffering problem",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "list",
                    "title": "No connectivity",
                    "subtitle": "Press '4' for No connectivity",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                }
            ]
            ]
        }
        agent.add(new Payload(agent.UNSPECIFIED,Data,{sendAsMessage:true, rawPayload:true }));
    }



    function generate_token(agent)
    {
        var option={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
        const option_val=agent.parameters.number;
        var val=option[option_val];
        
        var trouble_ticket=randomstring.generate(7);
        var user=user_name;

     
        var issue_val= val; 
        var status="pending";

        let time = Date.now();
        let date_ob = new Date(time);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear();

        var time_date=year + "-" + month + "-" + date;

        var obj = { username:user, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

        client.db("customer_information").collection("token").insertOne(obj, function(err, res) {
            if (err) throw err;
        }),
        
        agent.add("Sorry "+user+" for inconvenience!!!\nIssue reported : "+ val +"\nTicket number : "+trouble_ticket+"\nExpected resolution : "+time_date);
    }

    agent.handleRequest(intentMap);

}