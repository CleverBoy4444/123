create database if not exists ${name}
	default charset utf8
	default collate utf8_general_ci;

use ${name};

create table user (
	id int ( 11 ) not null auto_increment,
	name varchar ( 40 ) not null,
	password binary ( 64 ) not null,
	joined timestamp not null default current_timestamp,
	unique ( name ),
	primary key ( id )
) engine = innodb;

create table category (
	id int ( 11 ) not null auto_increment,
	owner int ( 11 ) not null,
	title tinytext not null,
	body text not null,
	created timestamp not null default current_timestamp,
	edited timestamp null default null,
	primary key ( id ),
	foreign key ( owner ) references user ( id )
) engine = innodb;

create trigger category_update before update on category
    for each row set new.edited = current_timestamp;

create table topic (
	id int ( 11 ) not null auto_increment,
	owner int ( 11 ) not null,
	category int ( 11 ) not null,
	title tinytext not null,
	body text not null,
	created timestamp not null default current_timestamp,
	edited timestamp null default null,
	primary key ( id ),
	foreign key ( owner ) references user ( id ),
	foreign key ( category ) references category ( id )
) engine = innodb;

create trigger topic_update before update on topic
    for each row set new.edited = current_timestamp;

create table chat (
	id int ( 11 ) not null auto_increment,
	owner int ( 11 ) not null,
	title tinytext null default null,
	created timestamp not null default current_timestamp,
	primary key ( id ),
	foreign key ( owner ) references user ( id )
) engine = innodb;

create table chat_user (
	id int ( 11 ) not null auto_increment,
	user int ( 11 ) not null,
	chat int ( 11 ) not null,
	primary key ( id ),
	foreign key ( user ) references user ( id ),
	foreign key ( chat ) references chat ( id )
) engine = innodb;

create table post (
	id int ( 11 ) not null auto_increment,
	owner int ( 11 ) not null,
	category int ( 11 ) null default null,
	topic int ( 11 ) null default null,
	chat int ( 11 ) null default null,
	body text not null,
	created timestamp not null default current_timestamp,
	edited timestamp null default null,
	primary key ( id ),
	foreign key ( owner ) references user ( id ),
	foreign key ( topic ) references topic ( id ),
	foreign key ( category ) references category ( id ),
	foreign key ( chat ) references chat ( id )
) engine = innodb;

create trigger post_update before update on post
    for each row set new.edited = current_timestamp;