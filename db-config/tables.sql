create database if not exists ${name}
    default charset utf8
    default collate utf8_general_ci;

use ${name};

create table user (
    id int ( 11 ) not null auto_increment,
    name varchar ( 40 ) not null,
    password binary ( 64 ) not null,
    joined datetime not null default current_timestamp,
    unique ( name ),
    primary key ( id )
) engine = innodb auto_increment=0;

create table category (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ) not null,
    title tinytext not null,
    body text not null,
    created datetime ( 6 ) default current_timestamp ( 6 ),
    edited datetime ( 6 ) null default null on update current_timestamp ( 6 ),
    primary key ( id ),
    foreign key ( owner ) references user ( id )
) engine = innodb auto_increment=0;

create table topic (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ) not null,
    category int ( 11 ) not null,
    title tinytext not null,
    body text not null,
    created datetime ( 6 ) default current_timestamp ( 6 ),
    edited datetime ( 6 ) null default null on update current_timestamp ( 6 ),
    primary key ( id ),
    foreign key ( owner ) references user ( id ),
    foreign key ( category ) references category ( id )
) engine = innodb auto_increment=0;

create table chat (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ) not null,
    title tinytext not null,
    created datetime ( 6 ) default current_timestamp ( 6 ),
    primary key ( id ),
    foreign key ( owner ) references user ( id )
) engine = innodb auto_increment=0;

create table chat_user (
    id int ( 11 ) not null auto_increment,
    user int ( 11 ) not null,
    primary key ( id ),
    foreign key ( user ) references user ( id )
) engine = innodb auto_increment=0;

create table post (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ) not null,
    topic int ( 11 ) null default null,
    category int ( 11 ) null default null,
    chat int ( 11 ) null default null,
    body text not null,
    created datetime ( 6 ) default current_timestamp ( 6 ),
    edited datetime ( 6 ) null default null on update current_timestamp ( 6 ),
    primary key ( id ),
    foreign key ( owner ) references user ( id ),
    foreign key ( topic ) references topic ( id ),
    foreign key ( category ) references category ( id ),
    foreign key ( chat ) references chat ( id )
) engine = innodb auto_increment=0;