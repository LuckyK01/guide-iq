revoke execute on function public.has_role(uuid, app_role) from anon, public;
revoke execute on function public.is_staff(uuid) from anon, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;