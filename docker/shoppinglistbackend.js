'use strict';

const backend="SQLServer";

const express = require('express');
const fs = require('fs');
const sql = require('mssql');
const url = require('url');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;
const AUTH_KEY=process.env.AUTH_KEY;

// App
const app = express();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

const config = {
     user: process.env.ShoppingList_User,
     password: process.env.ShoppingList_Password,
     server: process.env.ShoppingList_Host,
     database: process.env.ShoppingList_DB,
     trustServerCertificate: true
};

// Middleware that is called before any endpoint is reached
app.use(function (req, res, next) {
     const auth=(typeof req.query.auth_key !== 'undefined' ? req.query.auth_key : null);

    if (auth === null || AUTH_KEY == null || (auth != null && auth != AUTH_KEY))
         return res.status(403).send('Unauthorized');
    else //Carry on with the request chain
         next();
});

app.get('/', (req, res) => {
     return res.status(403).send('Unauthorized');
});

app.get('/AddPreferredStoreItem', (req, res) => {
     if (req.query.Name == null)
          throw new Error('Name was not provided in /AddPreferredStoreItem');
  
     if (req.query.PreferredStoreID == null)
          throw new Error('PreferredStoreID was not provided in /AddPreferredStoreItem');
  
     const name=req.query.Name;
     const preferredStoreID=req.query.PreferredStoreID;
     const notes=(req.query.Notes != null ? req.query.Notes : '');
 
     let params = [['Name',sql.VarChar,name],['PreferredStoreID',sql.Int,preferredStoreID],['Notes',sql.VarChar,notes]];

     const SQL = `INSERT INTO PreferredStoreItems (Name, PreferredStoreID, Notes, CreatedOn) VALUES(@Name,@PreferredStoreID,@Notes,${(backend == `SQLServer` ? `GETDATE()` : ``)}${(backend == `MySQL` ? `CURRENT_DATE` : ``)});`;

     //console.log(params);
     //res.send('');
     execSQL(res,SQL,params,false);
});

app.get('/AddPreferredStore', (req, res) => {
     if (req.query.Name == null)
          throw new Error('Name was not provided in /AddPreferredStore');
  
     const name=req.query.Name;
     const notes=(req.query.Notes != null ? req.query.Notes : '');

     let params = [['PreferredStoreName',sql.VarChar,name],['Notes',sql.VarChar,notes]];

     const SQL = `INSERT INTO PreferredStores (PreferredStoreName,Notes,CreatedOn) VALUES(@PreferredStoreName,@Notes,${(backend == `SQLServer` ? `GETDATE()` : ``)}${(backend == `MySQL` ? `CURRENT_DATE` : ``)});`;

      execSQL(res,SQL,params,false);
});

app.get('/AddShoppingListItem', (req, res) => {
     if (req.query.Name == null && req.query.PreferredStoreItemID == null)
          throw new Error('Name or Preferred Store item ID was not provided in /AddShoppingListItem');
  
     if (req.query.Qty == null)
          throw new Error('Qty was not provided in /AddShoppingListItem');
  
     const name=req.query.Name;
     const preferredStoreItemID=req.query.PreferredStoreItemID;
     const qty=req.query.Qty;
     const notes=(req.query.Notes != null ? req.query.Notes : null);

     let params = [['PreferredStoreItemID',sql.Int,preferredStoreItemID],['Qty',sql.Int,qty],['Notes',sql.VarChar,notes]];
     
     if (name != null) 
          params.push(['Name',sql.VarChar,name]);

if (notes != null) {
console.log("WTF!!");
}
     const columns = `${name != null ? `Name,` : ``}
                      ${preferredStoreItemID != null ? `PreferredStoreItemID,` : ``}
                      Qty,
                      ${notes != null ? `Notes,` : ``}
                      CreatedOn`;

     const values = `${name != null ? `@Name,` : ``}
                     ${preferredStoreItemID != null ? '@PreferredStoreItemID,' : ''}
                     @Qty,
                     ${notes != null ? `@Notes,` : ``}
                     ${backend == `SQLServer` ? `GETDATE()` : ``}${backend == `MySQL` ? `CURRENT_DATE` : ``}`;
     const SQL = `INSERT INTO ShoppingListItems (${columns}) VALUES (${values})`;

     //res.send(SQL.replace('@Name',name).replace('@PreferredStoreItemID', preferredStoreItemID).replace('@Qty',qty).replace('@Notes',notes));
     execSQL(res,SQL,params,false);
});

app.get('/DeletePreferredStoreItem', (req, res) => {
     if (req.query.PreferredStoreItemID == null)
          throw new Error('Preferred Store item ID was not provided in /DeletePreferredStoreItem');
  
     const preferredStoreItemID=req.query.PreferredStoreItemID;
     
     let params = [['PreferredStoreID',sql.Int,preferredStoreID]];
 
     const SQL = `DELETE FROM PreferredStoreItems WHERE PreferredStoreItemID=@PreferredStoreItemID;`;

     execSQL(res,SQL,params,false);
});

app.get('/DeletePreferredStore', (req, res) => {
     if (req.query.PreferredStoreID == null)
          throw new Error('Preferred Store ID was not provided in /DeletePreferredStore');
  
     const preferredStoreID=req.query.PreferredStoreID;
     
     let params = [['PreferredStoreID',sql.Int,preferredStoreID]];
 
     const SQL = `DELETE FROM PreferredStores WHERE PreferredStoreID=@PreferredStoreID;`;

     execSQL(res,SQL,params,false);
});

app.get('/DeleteShoppingListItem', (req, res) => {
     if (req.query.ShoppingListItemID == null)
          throw new Error('Shopping List Item ID was not provided in /DeleteShoppingListItem');
  
     const shoppingListItemID=req.query.ShoppingListItemID;
     
     let params = [['ShoppingListItemID',sql.Int,shoppingListItemID]];
 
     const SQL = `DELETE FROM ShoppingListItems WHERE ShoppingListItemID=@ShoppingListItemID;`;

     execSQL(res,SQL,params,false);
});

app.get('/GetPreferredStores', (req, res) => {
     const SQL = `SELECT * FROM PreferredStores ORDER BY PreferredStoreName;`;

     execSQL(res,SQL,null,true);
});

app.get('/GetPreferredStoreItems', (req, res) => {
     const SQL = `SELECT PreferredStoreItems.PreferredStoreItemID,PreferredStoreItems.Name,PreferredStoreItems.Notes,PreferredStores.PreferredStoreName,PreferredStores.PreferredStoreID FROM PreferredStoreItems LEFT JOIN PreferredStores ON PreferredStores.PreferredStoreID=PreferredStoreItems.PreferredStoreID ORDER BY Name;`;

     execSQL(res,SQL,null,true);
});

app.get('/GetShoppingList', (req, res) => {
     const SQL = `SELECT ShoppingListItemID,ShoppingListItems.PreferredStoreItemID,CASE WHEN PreferredStoreItems.PreferredStoreItemID IS NULL THEN ShoppingListItems.Name ELSE PreferredStoreItems.Name END AS Name,CASE WHEN PreferredStoreItems.PreferredStoreItemID IS NOT NULL THEN PreferredStoreName ELSE NULL END AS StoreName,Qty,CASE WHEN ShoppingListItems.Notes IS NULL THEN '' ELSE ShoppingListItems.Notes END + ' ' + CASE WHEN ShoppingListItems.PreferredStoreItemID IS NULL THEN '' ELSE PreferredStoreItems.Notes END AS Notes,IsCompleted,PreferredStores.PreferredStoreID FROM ShoppingListItems LEFT JOIN PreferredStoreItems ON PreferredStoreItems.PreferredStoreItemID=ShoppingLIstItems.PreferredStoreItemID LEFT JOIN PreferredStores ON PreferredStores.PreferredStoreID=PreferredStoreItems.PreferredStoreID WHERE IsCompleted=0 ORDER BY ShoppingLIstItems.Name ASC`;

     execSQL(res,SQL,null,true);
});

app.get('/MarkShoppingListItemCompleted', (req, res) => {
     const shoppingListItemID=req.query.ShoppingListItemID;
     
     let params = [['ShoppingListItemID',sql.Int,shoppingListItemID]];
 
     const SQL = `UPDATE ${(backend == `SQLServer` ? `TOP(1)` : ``)} ShoppingListItems SET IsCompleted=1 WHERE ShoppingListItemID=@ShoppingListItemID ${(backend == `MySQL` ? `LIMIT 1` : ``)};`;

     execSQL(res,SQL,params,false);
});

app.get('/UpdatePreferredStoreItem', (req, res) => {
     if (req.query.PreferredStoreItemID == null)
          throw new Error('Preferred Store Item ID was not provided in /UpdatePreferredStoreItem');
  
     if (req.query.Name == null)
          throw new Error('Name was not provided in /UpdatePreferredStoreItem');
  
     if (req.query.PreferredStoreID == null)
          throw new Error('Preferred Store ID was not provided in /UpdatePreferredStoreItem');
  
     const preferredStoreItemID=req.query.PreferredStoreItemID;
     const name=req.query.Name;
     const preferredStoreID=req.query.PreferredStoreID;
     const notes=(req.query.Notes != null ? req.query.Notes : '');
 
     let params = [['PreferredStoreItemID',sql.Int,preferredStoreItemID],['Name',sql.VarChar,name],['PreferredStoreID',sql.Int,preferredStoreID],['Notes',sql.VarChar,notes]];

     const SQL = `UPDATE PreferredStoreItems SET Name=@Name,${preferredStoreItemID != null ? `PreferredStoreID=@PreferredStoreID,` : ``}${notes != null ? `Notes=@Notes` : `Notes=''`} WHERE PreferredStoreItemID=@PreferredStoreItemID;`;

     //res.send(SQL.replace("@PreferredStoreID",preferredStoreID).replace("@Name",name).replace("@PreferredStoreItemID",preferredStoreItemID).replace("@Notes",notes));
     execSQL(res,SQL,params,false);
});

app.get('/UpdatePreferredStore', (req, res) => {
     if (req.query.PreferredStoreID == null)
          throw new Error('Preferred Store ID was not provided in /UpdatePreferredStore');
  
     if (req.query.Name == null)
          throw new Error('Name was not provided in /AddPreferredStore');
  
     const name=req.query.Name;
     const preferredStoreID=req.query.PreferredStoreID;
     const notes=(req.query.Notes != null ? req.query.Notes : '');
 
     let params = [['PreferredStoreID',sql.Int,preferredStoreID],['PreferredStoreName',sql.VarChar,name],['Notes',sql.VarChar,notes]];

     const SQL = `UPDATE PreferredStores SET PreferredStoreName=@PreferredStoreName,${notes != null ? `Notes=@Notes` : `Notes=NULL`} WHERE PreferredStoreID=@PreferredStoreID;`;

      execSQL(res,SQL,params,false);
});

app.get('/UpdateShoppingListItem', (req, res) => {
     if (req.query.ShoppingListItemID == null)
          throw new Error('Shopping List Item ID was not provided in /UpdateShoppingListItem');

     if (req.query.Name == null && req.query.PreferredStoreID == null)
          throw new Error('Name or Preferred Store Item ID was not provided in /UpdateShoppingListItem');
  
     if (req.query.Qty == null)
          throw new Error('Qty was not provided in /UpdateShoppingListItem');
  
     const preferredStoreItemID=req.query.PreferredStoreItemID;
     const name=req.query.Name;
     const shoppingListItemID=req.query.ShoppingListItemID;
     const qty=req.query.Qty;
     const notes=(req.query.Notes != null ? req.query.Notes : '');
 
     let params = [['Name',sql.VarChar,name],['PreferredStoreItemID',sql.Int,preferredStoreItemID],['ShoppingListItemID',sql.Int,shoppingListItemID],['Qty',sql.Int,qty],['Notes',sql.VarChar,notes]];
     
     const SQL = `UPDATE ShoppingListItems SET ${(name != null ? `Name=@Name,` : ``)} ${(preferredStoreItemID != null ? `PreferredStoreItemID=@PreferredStoreItemID,` : ``)} Qty=@Qty,${notes != null ? `Notes=@Notes` : `Notes=NULL`} WHERE ShoppingListItemID=@ShoppingListItemID;`;

     execSQL(res,SQL,params,false);
});

function execSQL(res,SQL,params,isQuery) {
     try {
          // connect to your database
          var connection = new Connection(config);

          sql.connect(config,function (err) {
               if (err) {
                    console.log(err);
               } else {
                    //console.log("Success");
                    const request = new sql.Request();

                    if (params != null) { // parameterize SQL query parameters 
                         for (let i=0;i<params.length;i++) {
                              request.input(params[i][0],params[i][1],params[i][2]);
                         }
                    }


                    request.query(SQL,function (err,data) {
                         if (err) console.log(err)

                         // send records as a response
			 if (isQuery)
                              res.send(data.recordset);
			 else
		              res.send('');
                    });
               }
          });
     } catch(e) {
          console.log("Error!");
     }
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
