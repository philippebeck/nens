# Nens 

API with Node, Express, NemJS & SQL

[![NPM Version](https://badgen.net/npm/v/nens)](https://www.npmjs.com/package/nens)

[![NPM Downloads](https://badgen.net/npm/dt/nens)](https://www.npmjs.com/package/nens)
[![GitHub Last Commit](https://badgen.net/github/last-commit/philippebeck/nens)](https://github.com/philippebeck/nens/commits/master)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/7e8b050c9e1a4350a1cbc93a1cbf85c0)](https://app.codacy.com/gh/philippebeck/nens/dashboard)
[![Maintainability](https://api.codeclimate.com/v1/badges/b7f0e56412a0b8c38be2/maintainability)](https://codeclimate.com/github/philippebeck/nens/maintainability)

[![GitHub Top Language](https://img.shields.io/github/languages/top/philippebeck/nens)](https://github.com/philippebeck/nens)
[![Code Size](https://img.shields.io/github/languages/code-size/philippebeck/nens)](https://github.com/philippebeck/nens/tree/master)

## Overview

Nens is an API made with Node, Express & MySQL, where you can find an "homemade" package complementary, NemJS, for JWT, Nodemailer, Sharp & back securities, as the backend services  

## Summary

- [Nens](#nens)
  - [Overview](#overview)
  - [Summary](#summary)
  - [Download](#download)
  - [Package](#package)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [DataBase](#database)
  - [Usage](#usage)
  - [Content](#content)
  - [Documentation](#documentation)

---

## Download

[Use this Template](https://github.com/philippebeck/nens/generate)  
or  
`git clone https://github.com/philippebeck/nens.git`  
or  
[Latest Release](https://github.com/philippebeck/nens/releases)  

---

## Package

NPM : `npm i nens`  
or  
Yarn : `yarn add nens`  

**If you choose to get Nens from NPM or Yarn : you need to copy Nens from *node_modules/nens* to the root of your App**

---

## Installation

Install the backend dependencies :  
`$ cd nens`  
`$ npm i`  

---

## Configuration

Concat the .env.example of NemJS with the .env.example of Nens :  
`$ grunt`

Configure the .env.compile by replacing the values *(like DB, Mailer & Token)* :  
`.env.compile` *(then rename it .env)*  

Your personal .env will be hidden in .gitignore automatically  

---

## DataBase

Import the database tables :  
`$ mysql -u root -p < data/DBTables.sql` or with a UI like phpMyAdmin  

Replace data from DBPublic.sql, add your own data, especially for users & products, then import this file :  
`$ mysql -u root -p < data/DBPublic.sql` or with a UI like phpMyAdmin  

Personally, I have another SQL file for private data (users & products), hidden in .gitignore  

---

## Usage

To run the backend server :  
`$ npm start`  

---
## Content

Available API Files :
-  **AuthCtrl, AuthRoute** *(Auth)*  
-  **UserModel, UserCtrl, UserRoute** *(Users)*  
-  **ProductModel, ProductCtrl, ProductRoute** *(Products)*  
-  **OrderModel, OrderCtrl, OrderRoute** *(Product Orders)*  
-  **ArticleModel, ArticleCtrl, ArticleRoute** *(Articles)*  
-  **ProjectModel, ProjectCtrl, ProjectRoute** *(Projects)*  
-  **LinkModel, LinkCtrl, LinkRoute** *(Links)*  
-  **GalleryModel, GalleryCtrl, GalleryRoute** *(Galleries)*  
-  **ImageModel, ImageCtrl, ImageRoute** *(Gallery Images)*  

---

## Documentation

Available Documentation :  
-  [**API**](https://github.com/philippebeck/nens/blob/main/swagger.yaml)  

Available Readme :  
-  [**NemJS**](https://github.com/philippebeck/nemjs)  
