USE cafe_cato;

ALTER TABLE productos ADD COLUMN imagen LONGTEXT NULL AFTER precio;
ALTER TABLE servicios ADD COLUMN imagen LONGTEXT NULL AFTER precio;