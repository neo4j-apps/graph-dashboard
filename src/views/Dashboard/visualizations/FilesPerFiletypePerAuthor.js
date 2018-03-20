import React, { Component } from 'react';
var AppDispatcher = require('../../../AppDispatcher');

import DashboardAbstract, { neo4jSession, databaseCredentialsProvided } from '../AbstractDashboardComponent';

import {ResponsiveBar} from '@nivo/bar';

var authorToFilterBy;

class FilesPerFiletypePerAuthor extends DashboardAbstract {

    constructor(props) {
        super(props);

        this.state = {
            data: [
              {
                "author": "Dummy",
                "filetype": "dum",
                "files": 1,
              }
            ],
            dataKeys: [
              "Dummy"
            ]
        };
    }

    componentWillMount() {
      super.componentWillMount();
    }
  
    componentDidMount() {
      super.componentDidMount();
      if (databaseCredentialsProvided) {
        this.readData();
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      authorToFilterBy = null;
    }

    handleAction(event) {
      var action = event.action;
      switch (action.actionType) {
        // Respond to CART_ADD action
        case 'SELECT_COMMITSPERAUTHOR':
          authorToFilterBy = action.data.indexValue;
          this.readData();
          break;
        default:
          return true;
      }
    }

    readData() {
      var aggregatedData = [];
      var aggregatedKeys = [];
      var thisBackup = this; //we need this because this is undefined in then() but we want to access the current state
      var recordCount = 0;

      var whereClause = ' NOT c:Merge ';
      //console.log(authorToFilterBy);
      if (authorToFilterBy && authorToFilterBy.length > 0) {
        whereClause = ' c.author contains \'' + authorToFilterBy + '\''; //TODO: contains is a workaround
        //TODO: this could result in a sql injection, proper enconding is needed!
      }

      var query =         'MATCH ' + 
      '  (a:Author)-[:COMMITTED]->(c:Commit)-[:CONTAINS_CHANGE]->(:Change)-[:MODIFIES]->(file:File) ' +
      'WHERE ' + 
        whereClause + 
      'RETURN ' + 
      '  file.type as filetype, a.name as author, count(file) as files ' +
      'ORDER BY ' + 
      '  files DESC, filetype ';
      neo4jSession.run(
        query
      ).then(function (result) {
        result.records.forEach(function (record) {
          var author = record.get(1);
          var filetype = record.get(0);
          var files = record.get(2).low;
          
          var found = false;
          aggregatedData.forEach(function (dataSet) {
            if (dataSet.author === author) { //found: only append author
              dataSet[filetype] = files;
              found = true;
            }
          });

          if (!found) { //create dataset
            aggregatedData.push({
              "author": author,
            });
            aggregatedData[aggregatedData.length - 1][filetype] = files;
          }

          if (aggregatedKeys.indexOf(filetype) === -1) {
            aggregatedKeys.push(filetype);
          }
        });
      }).then( function(context) {
        var grouping = [];
        aggregatedData.forEach(function (record) {

        })

      }).then( function(context) {
        thisBackup.setState(
          {
            data: aggregatedData,
            dataKeys: aggregatedKeys
          }
        );
      }).catch(function (error) {
          console.log(error);
      });
    }

    render() {
        var redirect = super.render();
        if (redirect.length > 0) {
          return(redirect);
        }

        //TODO: calculate height from this.state.dataKeys.length
        return (
          <div>
            <div style={{height: "4000px"}}> 
              <ResponsiveBar
                onClick={ function(event) { console.log(event) } }
                data={this.state.data}
                keys={this.state.dataKeys}
                indexBy="author"
                margin={{
                  "top": 50,
                  "right": 50,
                  "bottom": 50,
                  "left": 150
                }}
                padding={0.05}
                groupMode="stacked"
                layout="horizontal"
                colors="nivo"
                colorBy="id"
                defs={[
                  {
                    "id": "dots",
                    "type": "patternDots",
                    "background": "inherit",
                    "color": "#38bcb2",
                    "size": 4,
                    "padding": 1,
                    "stagger": true
                  },
                  {
                    "id": "lines",
                    "type": "patternLines",
                    "background": "inherit",
                    "color": "#eed312",
                    "rotation": -45,
                    "lineWidth": 6,
                    "spacing": 10
                  }
                ]}
                borderColor="inherit:darker(1.6)"
                axisBottom={{
                  "orient": "bottom",
                  "tickSize": 5,
                  "tickPadding": 5,
                  "tickRotation": 0,
                  "legend": "Filetypes",
                  "legendPosition": "center",
                  "legendOffset": 36
                }}
                axisLeft={{
                  "orient": "left",
                  "tickSize": 5,
                  "tickPadding": 5,
                  "tickRotation": 0,
                  "legend": "Number of files",
                  "legendPosition": "center",
                  "legendOffset": -140
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="inherit:darker(1.6)"
                animate={true}
                motionStiffness={90}
                motionDamping={15}
                legends={[
                  {
                      "dataFrom": "keys",
                      "anchor": "top-right",
                      "direction": "row",
                      "translateX": 0,
                      "translateY": -20,
                      "itemWidth": 20,
                      "itemHeight": 35,
                      "itemsSpacing": 10,
                      "symbolSize": 20,
                      "itemDirection": "top-to-bottom",
                      "justify": true
                  }
                ]}
              />
            </div>
          </div>
        )
    }
}

export default FilesPerFiletypePerAuthor;

