CREATE DATABASE IF NOT EXISTS `managesys` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

USE `managesys`;

CREATE TABLE `user` (
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `userstatus` boolean NOT NULL,
  `usergroups` varchar(255),
  `session` text,
  PRIMARY KEY (`username`),
  UNIQUE (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

INSERT INTO `user` (`username`, `password`, `email`, `usergroups`, `userstatus`, `session`)
VALUES ('test', 'abc123!!', 'test@test.com', 'test@test.com', 1, 'hardcode@example1234567890qwertyuiopasdfghjklxzxcvbnm');
USE `managesys`;

INSERT INTO `user` (`username`, `password`, `email`, `usergroups`, `userstatus`, `session`)
VALUES ('testtwo', 'abc123!!', 'test2@test.com', 'testgroup', 1, 'hardcode@example1234567890qwertyuiopasdfghjklxzxcvbnm');
USE `managesys`;

CREATE TABLE `usergroups` (
  `usergroups` varchar(255) NOT NULL,
  PRIMARY KEY (`usergroups`)
);

INSERT INTO `usergroups` (`usergroups`)
VALUES ('dev'),
		    ('PL'),
        ('PM');

CREATE TABLE Application (
App_Acronym varchar(255) NOT NULL,
App_Description LONGTEXT,  
App_Rnumber BIGINT NOT NULL,
App_startDate varchar(63),  
App_endDate varchar(63),
App_permit_Open varchar(255),  
App_permit_toDoList varchar(255),
App_permit_Doing varchar(255),  
App_permit_Done varchar(255),
App_permit_create varchar(255),
PRIMARY KEY (`App_Acronym`)
);

CREATE TABLE Plan (
Plan_MVP_Name varchar(255) NOT NULL,
Plan_startDate varchar(63),  
Plan_endDate varchar(63),
Plan_app_Acronym varchar(255) NOT NULL, 
Plan_colour varchar(63),  
PRIMARY KEY (`Plan_MVP_Name`)
);

CREATE TABLE Task (
Task_name varchar(255) NOT NULL,
Task_description LONGTEXT,
Task_notes LONGTEXT,
Task_plan varchar(255),
Task_app_Acronym varchar(255) NOT NULL,
Task_state varchar(255) NOT NULL,  
Task_creator varchar(255) NOT NULL,
Task_owner varchar(255),
Task_createDate varchar(255) NOT NULL,
Task_id varchar(255) NOT NULL,
PRIMARY KEY (`Task_name`),
UNIQUE (`Task_id`)
);


-- /* alter user 'root'@'localhost' identified with mysql_native_password by 'admin'; 
-- Above code is if you cant get that connection
