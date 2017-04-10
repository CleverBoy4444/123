delimiter //
create trigger set_user_joined_date before insert on user
for each row begin
    set new.joined = now ();
end//
delimiter ;

delimiter //
create trigger err_on_user_update before update on user
for each row begin
    signal sqlstate '45000'
    set message_text = 'update user not permitted, contact system administrator to change user info';
end//
delimiter ;

delimiter //
create trigger warn_on_category_update before update on category
for each row begin
    if ( new.created is not null and new.created != old.created ) then
        set new.created = old.created;
        signal sqlstate '01000'
        set message_text = 'cannot change category ( created ), reverting to original date';
    end if;
    if ( new.edited is not null ) then
        set new.edited = current_timestamp ( 6 );
        signal sqlstate '01000'
        set message_text = 'category ( edited ) field is automatically updated';
    end if;
end//
delimiter ;

delimiter //
create trigger warn_on_topic_update before update on topic
for each row begin
    if ( new.created is not null and new.created != old.created ) then
        set new.created = old.created;
        signal sqlstate '01000'
        set message_text = 'update user not permitted, contact system administrator to change user info';
    end if;
    if ( new.edited is not null ) then
        set new.edited = current_timestamp ( 6 );
        signal sqlstate '01000'
        set message_text = 'topic ( edited ) field is automatically updated';
    end if;
end//
delimiter ;
