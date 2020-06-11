const axios = require("axios");
const qs = require("qs");
const dotenv = require('dotenv');
dotenv.config();
const apiUrl = process.env.API_URL;
const displayHome = async (user, data) => {
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

const openCreateTaskModal = async trigger_id => {
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
        "type": "input",
        "element": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a mechanic",
            "emoji": true
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-0"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-1"
            },
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-2"
            }
          ]
        },
        "label": {
          "type": "plain_text",
          "text": "Label",
          "emoji": true
        }
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
      
      
    ]
  };

  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    trigger_id: trigger_id,
    view: JSON.stringify(modalExpense)
  };

  const result = await axios.post(`${apiUrl}/views.open`, qs.stringify(args));
};

module.exports = { displayHome, openCreateTaskModal };
