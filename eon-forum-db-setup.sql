create database eon_forums;

use eon_forums;

create table user (
    id int ( 11 ) not null auto_increment,
    name varchar ( 40 ) not null,
    password binary ( 64 ) not null,
    email binary ( 64 ) not null,
    join_date date not null,
    unique ( id ),
    unique ( name ),
    primary key ( id )
) engine = innodb;

create table category (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ),
    subject varchar ( 200 ) not null,
    description varchar ( 8000 ) not null,
    unique ( id ),
    primary key ( id ),
    foreign key ( owner ) references user ( id )
) engine = innodb;

create table topic (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ),
    category int ( 11 ),
    subject varchar ( 200 ) not null,
    description varchar ( 8000 ) not null,
    unique ( id ),
    primary key ( id ),
    foreign key ( owner ) references user ( id ),
    foreign key ( category ) references category ( id )
) engine = innodb;

create table post (
    id int ( 11 ) not null auto_increment,
    owner int ( 11 ),
    topic int ( 11 ),
    subject varchar ( 200 ) not null,
    description varchar ( 8000 ) not null,
    unique ( id ),
    primary key ( id ),
    foreign key ( owner ) references user ( id ),
    foreign key ( topic ) references topic ( id )
) engine = innodb;