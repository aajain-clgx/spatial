USE `webusage`;

DROP TABLE IF EXISTS `webusage`.`userapi`;
CREATE TABLE  `webusage`.`userapi` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `PublicKey` varchar(256) NOT NULL,
  `PrivateKey` varchar(255) NOT NULL,
  KEY `FK_UserAPI_1` (`ID`),
  CONSTRAINT `FK_UserAPI_1` FOREIGN KEY (`ID`) REFERENCES `users` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;


# Private Key -> Salted Private Key
# 'jux2m7k3xr' -> '4qgCyF0qQrdyj34/g+C7dGfjJ7A='
# 'jsjrybvs4i' -> 'bVis8HPWaP3mEi48PMLa4PW+3To=' 

INSERT INTO `webusage`.`userapi` VALUE(34, '425032B8C0FB434992F69370FED9D071', 'jux2m7k3xr');
INSERT INTO `webusage`.`userapi` VALUE(78, '3EF991329350494487AF7136554C095C', 'jsjrybvs4i');


DELIMITER $$

DROP FUNCTION IF EXISTS `GetLayerAccessForNodeUser` $$
CREATE FUNCTION `GetLayerAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
         DECLARE layerAccessList TEXT DEFAULT '';
         DECLARE UName TEXT DEFAULT '';
         SELECT UserName
           INTO UName
           FROM Users
           WHERE ID = userid;
         SELECT GROUP_CONCAT(DISTINCT `webusage`.`datasource`.Name)
             INTO layerAccessList
             FROM `webusage`.`datasource`, `webusage`.`groupxdatasource`, `webusage`.`userxgroup`
             WHERE
                 `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxdatasource`.`groupname` AND
                 `webusage`.`userxgroup`.`username` = uname AND
                 `webusage`.`datasource`.`ID` = `webusage`.`groupxdatasource`.`ID` AND
                 `webusage`.`datasource`.`DataSourceTypeID` = 3;
         RETURN layerAccessList;
     END $$

DELIMITER ;

DELIMITER $$

DROP FUNCTION IF EXISTS `GetRasterDatasetAccessForNodeUser` $$
CREATE FUNCTION `GetRasterDatasetAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
        DECLARE rasterDatasetAccessList TEXT DEFAULT '';
        DECLARE UName TEXT DEFAULT '';
        SELECT UserName
           INTO UName
           FROM Users
           WHERE ID = userid;
        SELECT GROUP_CONCAT(DISTINCT `webusage`.`datasource`.`name`)
         INTO rasterDatasetAccessList
         FROM `datasource`, `webusage`.`groupxdatasource`, `webusage`.`userxgroup`
         WHERE
             `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxdatasource`.`groupname` AND
             `webusage`.`userxgroup`.`username` = uname AND
             `webusage`.`datasource`.`ID` = `webusage`.`groupxdatasource`.`ID` AND
             `webusage`.`datasource`.`DataSourceTypeID` = 2;

        RETURN rasterDatasetAccessList;
    END $$

DELIMITER ;

DELIMITER $$

DROP FUNCTION IF EXISTS `GetFeatureAccessForNodeUser` $$
CREATE DEFINER=`ProxixAdmin`@`%` FUNCTION `GetFeatureAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
    DECLARE featureAccessList TEXT DEFAULT '';
    DECLARE UName TEXT DEFAULT '';
    SELECT UserName
        INTO UName
        FROM Users
        WHERE ID = userid;
    SELECT GROUP_CONCAT(DISTINCT `webusage`.`feature`.Name)
        INTO featureAccessList
        FROM `webusage`.`feature`, `webusage`.`groupxfeature`, `webusage`.`userxgroup`
        WHERE
            `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxfeature`.`groupname` AND
            `webusage`.`userxgroup`.`username` = uname AND
            `webusage`.`feature`.`ID` = `webusage`.`groupxfeature`.`ID`
        order by webusage.feature.name;
    RETURN featureAccessList;
END $$

DELIMITER ;


DELIMITER $$

DROP FUNCTION IF EXISTS `GetGeocodingDatasetAccessForNodeUser` $$
CREATE FUNCTION `GetGeocodingDatasetAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
        DECLARE geoDatasetAccessList TEXT DEFAULT '';
        DECLARE UName TEXT DEFAULT '';
        SELECT UserName
           INTO UName
          FROM Users
          WHERE ID = userid;
        SELECT GROUP_CONCAT(DISTINCT `webusage`.`datasource`.Name)
            INTO geoDatasetAccessList
            FROM `webusage`.`datasource`, `webusage`.`groupxdatasource`, `webusage`.`userxgroup`
            WHERE
                `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxdatasource`.`groupname` AND
                `webusage`.`userxgroup`.`username` = uname AND
                `webusage`.`datasource`.`ID` = `webusage`.`groupxdatasource`.`ID` AND
                `webusage`.`datasource`.`DataSourceTypeID` = 1;
        RETURN geoDatasetAccessList;
    END $$

DELIMITER ;



DELIMITER $$

DROP FUNCTION IF EXISTS `GetApplicationAccessForNodeUser` $$
CREATE FUNCTION `GetApplicationAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
    DECLARE appAccessList TEXT DEFAULT '';
    DECLARE UName TEXT DEFAULT '';
      SELECT UserName
        INTO UName
        FROM Users
        WHERE ID = userid;
    SELECT GROUP_CONCAT(DISTINCT `webusage`.`groupxapp`.`appname`)
        INTO appAccessList
        FROM `webusage`.`userxgroup`, `webusage`.`groupxapp`
        WHERE
            `webusage`.`userxgroup`.`username` = uname AND
            `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxapp`.`groupname`;
    RETURN appAccessList;
END $$

DELIMITER ;


DELIMITER $$

DROP FUNCTION IF EXISTS `GetDocumentAccessForNodeUser` $$
CREATE FUNCTION `GetDocumentAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
    DECLARE documentAccessList TEXT DEFAULT '';
    DECLARE UName TEXT DEFAULT '';
    SELECT UserName
        INTO UName
        FROM Users
        WHERE ID = userid;
    SELECT GROUP_CONCAT(DISTINCT `webusage`.`groupxdocview`.`DirName`)
        INTO documentAccessList
        FROM `webusage`.`groupxdocview`, `webusage`.`userxgroup`
         WHERE
             `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxdocview`.`groupname` AND
             `webusage`.`userxgroup`.`username` = uname;
    RETURN documentAccessList;
END $$

DELIMITER ;


DELIMITER $$

DROP FUNCTION IF EXISTS `GetPageAccessForNodeUser` $$
CREATE FUNCTION `GetPageAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
        DECLARE pagesAccessList TEXT DEFAULT '';
        DECLARE UName TEXT DEFAULT '';
        SELECT UserName
          INTO UName
          FROM Users
          WHERE ID = userid;
        SELECT GROUP_CONCAT(DISTINCT page_id)
            INTO pagesAccessList
            FROM `webusage`.`groupxpage`, `webusage`.`userxgroup`
            WHERE
            `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxpage`.`groupname` AND
            `webusage`.`userxgroup`.`username` = uname;
        RETURN pagesAccessList;
    END $$

DELIMITER ;


DELIMITER $$

DROP FUNCTION IF EXISTS `GetOperationAccessForNodeUser` $$
CREATE DEFINER=`ProxixAdmin`@`%` FUNCTION `GetOperationAccessForNodeUser`(userid INTEGER) RETURNS text CHARSET latin1
    DETERMINISTIC
BEGIN
  DECLARE operationAccessList TEXT DEFAULT '';
  DECLARE UName TEXT DEFAULT '';
  SELECT UserName
    INTO UName
    FROM Users
    WHERE ID = userid;
  SELECT GROUP_CONCAT(DISTINCT `webusage`.`operation`.Name)
    INTO operationAccessList
    FROM `webusage`.`operation`, `webusage`.`groupxoperation`, `webusage`.`userxgroup`
    WHERE
        `webusage`.`userxgroup`.`groupname` = `webusage`.`groupxoperation`.`groupname` AND
        `webusage`.`userxgroup`.`username` = uname AND
        `webusage`.`operation`.`ID` = `webusage`.`groupxoperation`.`ID`;
  RETURN operationAccessList;
END $$

DELIMITER ;

CREATE OR REPLACE VIEW `userapipermissionsview` AS
  (SELECT
    `userapi`.`ID` as `UserID`,
    `userapi`.`PublicKey` as `PublicKey`,
    `userapi`.`PrivateKey` as `PrivateKey`,
    `users`.`username` AS `Username`,
    `users`.`usertype` AS `UserType`,
    `ue`.`ExpirationDate` AS `ExpirationDate`,
    IF (((CHAR_LENGTH(`ud`.`DisabledReason`) > 0) or (CURDATE() > `ur`.`PwdChangeByDate`)),1,0) AS `Disabled`,
    `ur`.`PwdChangeByDate` AS `PasswordChangeByDate`,
    `GetLayerAccessForNodeUser`(`userapi`.`ID`) AS `LayerAccessList`,
    `GetFeatureAccessForNodeUser`(`userapi`.`ID`) AS `FeatureAccessList`,
    `GetOperationAccessForNodeUser`(`userapi`.`ID`) AS `OperationAccessList`,
    `GetGeocodingDatasetAccessForNodeUser`(`userapi`.`ID`) AS `GDSAccessList`,
    `GetRasterDatasetAccessForNodeUser`(`userapi`.`ID`) AS `RasterAccessList`,
    `GetDocumentAccessForNodeUser`(`userapi`.`ID`) AS `DocAccessList`,
    `GetPageAccessForNodeUser`(`userapi`.`ID`) AS `PageAccessList`,
    `GetApplicationAccessForNodeUser`(`userapi`.`ID`) AS `AppAccessList`
  FROM (
         userapi JOIN `users` ON (userapi.id = users.id)
                 LEFT JOIN `usersdisabled` `ud` ON (`userapi`.`ID` = `ud`.`ID`)
                 LEFT JOIN `usersexpiration` `ue` ON (`userapi`.`ID` = `ue`.`ID`)
                 LEFT JOIN `userspwdresetdate` `ur` ON (`userapi`.`ID` = `ur`.`ID`)

       )
);

DELIMITER $$

DROP PROCEDURE IF EXISTS `GetUserAccountInfoForNodeUser` $$
CREATE PROCEDURE `GetUserAccountInfoForNodeUser`(param_publickey TEXT)
BEGIN
    SELECT
        userview.username AS `UserName`,
        userview.fullName AS `FullName` ,
        userview.email_address AS `EmailAddress`,
        userview.phone AS `Phone`,
        userview.companyname AS `CompanyName`,
        userview.usertype AS `UserType`,
        userview.homepage AS `HomePage`,
        userview.create_date AS `CreateDate`,
        userview.disabled AS `Disabled`,
        userview.disabledReason As `DisabledReason`,
        userview.expire_date AS `AccountExpirationDate`
    FROM
    `webusage`.`userview`, `webusage`.`userapi`
    WHERE
    `userapi`.publickey = param_publickey and userapi.id = userview.id;
END $$

DELIMITER ;
