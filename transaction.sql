/*
Navicat MySQL Data Transfer

Source Server         : localhost_3306
Source Server Version : 50096
Source Host           : localhost:3306
Source Database       : transaction

Target Server Type    : MYSQL
Target Server Version : 50096
File Encoding         : 65001

Date: 2017-01-14 23:42:04
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `deal`
-- ----------------------------
DROP TABLE IF EXISTS `deal`;
CREATE TABLE `deal` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(45) character set utf8 NOT NULL,
  `currency` varchar(45) default 'GBP',
  `fund` varchar(45) default 'validus fund',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for `cashflows`
-- ----------------------------
DROP TABLE IF EXISTS `cashflows`;
CREATE TABLE `cashflows` (
  `id` int(11) NOT NULL auto_increment,
  `deal_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `type` varchar(45) character set utf8 default NULL,
  `cashflows` double default NULL,
  PRIMARY KEY  (`id`),
  KEY `deal_id` (`deal_id`),
  CONSTRAINT `deal_id` FOREIGN KEY (`deal_id`) REFERENCES `deal` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
