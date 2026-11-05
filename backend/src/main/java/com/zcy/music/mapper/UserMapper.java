package com.zcy.music.mapper;

import com.zcy.music.entity.User;
import com.zcy.music.vo.UserVO;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 用户表数据访问。
 */
@Mapper
public interface UserMapper {

    @Select("SELECT * FROM `user` WHERE username = #{username}")
    User findByUsername(String username);

    @Select("SELECT * FROM `user` WHERE id = #{id}")
    User findById(Long id);

    @Select("SELECT id, username, role, status FROM `user` WHERE id = #{id}")
    User findAuthById(Long id);

    @Select("SELECT id, username, nickname, avatar, gender, birthday, signature, phone, email, role, status, create_time "
            + "FROM `user` WHERE id = #{id}")
    UserVO findVOById(Long id);

    @Insert("INSERT INTO `user`(username, password, nickname, avatar, gender, signature, role, status) "
            + "VALUES(#{username}, #{password}, #{nickname}, #{avatar}, #{gender}, #{signature}, #{role}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE `user` SET nickname = #{nickname}, avatar = #{avatar}, gender = #{gender}, "
            + "birthday = #{birthday}, signature = #{signature}, phone = #{phone}, email = #{email}, "
            + "update_time = NOW() WHERE id = #{id}")
    int updateProfile(User user);

    @Update("UPDATE `user` SET password = #{password}, update_time = NOW() WHERE id = #{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    /** 后台：修改角色 / 状态 */
    @Update("UPDATE `user` SET role = #{role}, status = #{status}, update_time = NOW() WHERE id = #{id}")
    int updateRoleStatus(@Param("id") Long id, @Param("role") Integer role, @Param("status") Integer status);

    @Select("<script>"
            + "SELECT id, username, nickname, avatar, gender, birthday, signature, phone, email, role, status, create_time "
            + "FROM `user`"
            + "<where>"
            + "<if test='keyword != null and keyword != \"\"'>"
            + "AND (username LIKE CONCAT('%', #{keyword}, '%') OR nickname LIKE CONCAT('%', #{keyword}, '%'))"
            + "</if>"
            + "</where>"
            + " ORDER BY id ASC LIMIT #{offset}, #{size}"
            + "</script>")
    List<UserVO> selectPage(@Param("keyword") String keyword,
                            @Param("offset") long offset,
                            @Param("size") int size);

    @Select("<script>"
            + "SELECT COUNT(*) FROM `user`"
            + "<where>"
            + "<if test='keyword != null and keyword != \"\"'>"
            + "AND (username LIKE CONCAT('%', #{keyword}, '%') OR nickname LIKE CONCAT('%', #{keyword}, '%'))"
            + "</if>"
            + "</where>"
            + "</script>")
    long countPage(@Param("keyword") String keyword);

    @Select("SELECT COUNT(*) FROM `user`")
    long countAll();

    @Select("SELECT COUNT(*) FROM `user` WHERE DATE(create_time) = CURDATE()")
    long countToday();
}
