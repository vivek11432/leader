const axios = require("axios");
const qs = require("qs");
const dotenv = require('dotenv');
dotenv.config();
const apiUrl = process.env.API_URL;
const SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN;
var request = require('request');
const displayHome = async (user, data) => {
  var dynamicBlock = [];
  for(var ii = 0; ii < data.length; ii++){
    dynamicBlock = dynamicBlock.concat([
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Lead - #${data[ii].id}*`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Created by* - @${data[ii].created_by_name}\n\n*Mechanic Name* - @${data[ii].mechanic_name}\n\n*Customer Name* - ${data[ii].customer_name}\n\n*Lead Status* - ${data[ii].status}\n\n*Appointment Date* - ${data[ii].appointment_date}\n\n*Lead Description* - \n${data[ii].lead_description}\n`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Accept",
              "emoji": true
            },
            "style": "primary",
            "value": "reject_lead"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Reject",
              "emoji": true
            },
            "value": "accept_lead"
          }
        ]
      },
      {
        "type": "divider"
      }
    ])
  }
  let blocks =  [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Here's what you can do with Project Tracker:*"
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Create New Task",
						"emoji": true
					},
					"style": "primary",
          "value": "create_task",
          "action_id": "create_task"
				}
			]
		},
		{
			"type": "context",
			"elements": [
				{
					"type": "image",
					"image_url": "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
					"alt_text": "placeholder"
				}
			]
		}
  ];
  blocks = blocks.concat(dynamicBlock);
  let view = {
    type: "home",
    title: {
      type: "plain_text",
      text: "Keep notes!"
    },
    blocks: blocks,
  };
  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: JSON.stringify(view)
  };
  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));
  try {
    if (result.data.error) {
      console.log(result.data.error);
    }
  } catch (e) {
    console.log(e);
  }
};

const getUsersList = function(){
  request({
    url: apiUrl+ '/users.list', //URL to hit
    qs: {token: SLACK_OAUTH_TOKEN}, //Query string data
    method: 'GET', //Specify the method
  }, function (error, response, body) {
    if (error) {
      return [];
    } else {
      // console.log(JSON.parse(body))
      return JSON.parse(body);
    }
  })
}

const openCreateTaskModal = async trigger_id => {
  var userList = [], userListBlock = [];
  request({
    url: apiUrl+ '/users.list', //URL to hit
    qs: {token: SLACK_OAUTH_TOKEN}, //Query string data
    method: 'GET', //Specify the method
  }, function (error, response, body) {
    if (error) {
      return [];
    } else {
      var members = JSON.parse(body).members;
      console.log(members);
      for(var ii =0; ii < members.length; ii++){
        if(!members.is_bot && members[ii].profile.display_name ){
          userList.push(members[ii]);
          userListBlock.push(
            {
              "text": {
                "type": "plain_text",
                "text": members[ii].name,
                "emoji": true
              },
              "value": members[ii].id
            }
          )
        }
      }
      const modalExpense = {
        title: {
          type: "plain_text",
          text: "Create Lead"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        type: "modal",
        close: {
          type: "plain_text",
          text: "Cancel"
        },
        blocks: [
          {
            block_id: "expense_heading",
            type: "section",
            text: {
              type: "plain_text",
              text:
                "The following form will create a Lead and send it for approval."
            }
          },
          {
            type: "divider"
          },
          {
            block_id: "customer_name",
            type: "input",
            element: {
              action_id: "customer_name_id",
              type: "plain_text_input"
            },
            label: {
              type: "plain_text",
              text: "Customer Name"
            }
          },
          {
            type: "divider"
          },
          {
            block_id: "lead_description",
            type: "input",
            element: {
              action_id: "lead_description_id",
              type: "plain_text_input",
              multiline: true
            },
            label: {
              type: "plain_text",
              text: "Lead description"
            }
          },
          {
            block_id: "lead_date",
            type: "input",
            element: {
              action_id: "lead_date_val",
              type: "datepicker",
              initial_date: "2020-01-08",
              placeholder: {
                type: "plain_text",
                text: "Select lead date"
              }
            },
            label: {
              type: "plain_text",
              text: "Lead Date"
            }
          },
          {
            block_id: "mechanic",
            type: "input",
            element: {
              action_id: "mechanic_id",
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select a mechanic",
                emoji: true
              },
              options: userListBlock
            },
            label: {
              type: "plain_text",
              text: "Select a mechanic",
              emoji: true
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
                alt_text: "placeholder"
              }
            ]
          }
        ]
      };
    
      const args = {
        token: process.env.SLACK_BOT_TOKEN,
        trigger_id: trigger_id,
        view: JSON.stringify(modalExpense)
      };
    
      const result = axios.post(`${apiUrl}/views.open`, qs.stringify(args));
    }
  })
};

module.exports = { displayHome, openCreateTaskModal };
