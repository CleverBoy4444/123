delimiter //
create trigger post_insert_single_ref before insert on post
for each row begin
    if ( ( (new.category is not null) + (new.topic is not null) + (new.chat is not null) ) != 1 ) then
        signal sqlstate '45000'
        set message_text = 'CREATE_POST failed: there must be only one of \'category\', \'topic\' and \'chat\' with a non-null value';
    end if;
end//
delimiter ;

delimiter //
create trigger post_update_single_ref before update on post
for each row begin
    if ( new.category is not null || new.topic is not null || new chat is not null ) then
        if ( ( (new.category is not null) + (new.topic is not null) + (new.chat is not null) ) != 1 ) then
            signal sqlstate '45000'
            set message_text = 'MOVE_POST failed: there must be only one of \'category\', \'topic\' and \'chat\' with a non-null value';
        end if;
    else if ( new.category is null and new.topic is null and new.chat is null ) then
        set new.category = old.category;
        set new.topic = old.topic;
        set new.chat = old.chat;
    end if;
    if ( new.owner is null ) then
        set new.owner = old.owner;
    end if;
    if ( new.owner != old.owner ) then
        signal sqlstate '45000'
        set message_text = 'UPDATE_POST failed: post cannot change owners'
end//
delimiter ;