


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."banco_tipo" AS ENUM (
    'CORRENTE',
    'POUPANCA',
    'CAIXA',
    'CARTAO',
    'INVESTIMENTO',
    'OUTRO'
);


ALTER TYPE "public"."banco_tipo" OWNER TO "postgres";


CREATE TYPE "public"."customer_person_type" AS ENUM (
    'PF',
    'PJ'
);


ALTER TYPE "public"."customer_person_type" OWNER TO "postgres";


CREATE TYPE "public"."customer_status" AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE "public"."customer_status" OWNER TO "postgres";


CREATE TYPE "public"."discount_type" AS ENUM (
    'PERCENTUAL',
    'VALOR_FIXO'
);


ALTER TYPE "public"."discount_type" OWNER TO "postgres";


CREATE TYPE "public"."metodo_pagamento" AS ENUM (
    'DINHEIRO',
    'PIX',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'TRANSFERENCIA',
    'BOLETO',
    'CHEQUE',
    'OUTRO'
);


ALTER TYPE "public"."metodo_pagamento" OWNER TO "postgres";


CREATE TYPE "public"."sale_discount_type" AS ENUM (
    'VALOR_FIXO',
    'PERCENTUAL'
);


ALTER TYPE "public"."sale_discount_type" OWNER TO "postgres";


CREATE TYPE "public"."sale_status" AS ENUM (
    'PENDENTE',
    'CONCLUIDA',
    'CANCELADA'
);


ALTER TYPE "public"."sale_status" OWNER TO "postgres";


CREATE TYPE "public"."seller_type" AS ENUM (
    'dealership',
    'store',
    'private'
);


ALTER TYPE "public"."seller_type" OWNER TO "postgres";


CREATE TYPE "public"."tipos_transacao" AS ENUM (
    'RECEITA',
    'DESPESA'
);


ALTER TYPE "public"."tipos_transacao" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_status" AS ENUM (
    'Em venda',
    'Em breve',
    'Vendido',
    'Rascunho',
    'Pagamento'
);


ALTER TYPE "public"."vehicle_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (
    id,
    email,
    name,
    profile_id,
    department_id,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    nullif(new.raw_user_meta_data->>'profile_id', '')::int,
    nullif(new.raw_user_meta_data->>'department_id', '')::int,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.users.name),
        profile_id = coalesce(excluded.profile_id, public.users.profile_id),
        department_id = coalesce(excluded.department_id, public.users.department_id),
        updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_auth_user_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.email is distinct from old.email then
    update public.users
       set email = new.email,
           updated_at = now()
     where id = new.id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."update_auth_user_email"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_generation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" bigint,
    "user_id" "uuid",
    "month_reference" "date" NOT NULL,
    "action_type" "text" NOT NULL,
    "model_used" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "generated_content" "text"
);


ALTER TABLE "public"."ai_generation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ai_description_monthly_limit" integer DEFAULT 30 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ai_description_usage_count" integer DEFAULT 0,
    "ai_description_last_reset" "date" DEFAULT CURRENT_DATE,
    "banner_interval" numeric(10,2) DEFAULT 6000,
    "banner_duration" numeric(10,2) DEFAULT 40
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" bigint NOT NULL,
    "titulo" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valor_inicial" numeric(14,2) DEFAULT 0 NOT NULL,
    "agencia" "text",
    "conta_numero" "text",
    "tipo" "public"."banco_tipo" DEFAULT 'CORRENTE'::"public"."banco_tipo" NOT NULL,
    "proprietario" "text",
    "ativo" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


ALTER TABLE "public"."bank_accounts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bank_accounts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "link" "text",
    "order" integer DEFAULT 0,
    "image_url" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" bigint NOT NULL,
    "person_type" "public"."customer_person_type" NOT NULL,
    "cpf_cnpj" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address" "text",
    "address_number" "text",
    "address_complement" "text",
    "neighborhood" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "zip_code" "text",
    "state_registration" "text",
    "municipal_registration" "text",
    "city_code" "text",
    "status" "public"."customer_status" DEFAULT 'ATIVO'::"public"."customer_status" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "customers_email_format_chk" CHECK (("email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::"text"))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


ALTER TABLE "public"."customers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" integer NOT NULL,
    "name" character varying NOT NULL,
    "description" character varying,
    "manager" "text",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


ALTER TABLE "public"."departments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."departments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."document_categories" (
    "id" integer NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_categories" OWNER TO "postgres";


ALTER TABLE "public"."document_categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."document_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" integer NOT NULL,
    "nome" "text" NOT NULL,
    "codigo" "text" DEFAULT 'OUTRO'::"text" NOT NULL,
    "descricao" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


ALTER TABLE "public"."payment_methods" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."payment_methods_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "module" "text" NOT NULL,
    "action" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "id" integer NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" integer NOT NULL,
    "name" character varying NOT NULL,
    "description" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_name" "text" NOT NULL,
    "permission_slug" "text" NOT NULL,
    "id" integer NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


ALTER TABLE "public"."role_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."role_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" bigint NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "customer_id" bigint NOT NULL,
    "seller_id" "uuid",
    "status" "public"."sale_status" DEFAULT 'PENDENTE'::"public"."sale_status" NOT NULL,
    "total_value" numeric NOT NULL,
    "sub_total" numeric NOT NULL,
    "discount_type" "public"."discount_type",
    "discount_value" numeric,
    "payment_method" "text",
    "fiscal_observations" "text",
    "commission_percent_applied" numeric(5,2),
    "sale_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "canceled_at" timestamp with time zone,
    "canceled_by" "uuid"
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


ALTER TABLE "public"."sales" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."sales_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "name" character varying NOT NULL,
    "department_id" integer,
    "profile_id" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "active" boolean DEFAULT true NOT NULL,
    "salary" numeric(12,2),
    "commission_percent" numeric(5,2),
    "admission_date" "date",
    "termination_date" "date",
    "is_root" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" bigint NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "version" "text" NOT NULL,
    "year" integer NOT NULL,
    "year_model" integer NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "fipe" numeric(12,2),
    "mileage" integer,
    "fuel" "text" NOT NULL,
    "transmission" "text" NOT NULL,
    "color" "text" NOT NULL,
    "doors" integer,
    "body_type" "text" NOT NULL,
    "image" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "seller" "text" NOT NULL,
    "seller_type" "public"."seller_type" NOT NULL,
    "features" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "description" "text" NOT NULL,
    "enable_ai_description" boolean DEFAULT false NOT NULL,
    "ai_description" "text",
    "engine_size" "text",
    "horsepower" integer,
    "is_new" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "updated_by" "uuid",
    "deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "status" "public"."vehicle_status" DEFAULT 'Rascunho'::"public"."vehicle_status" NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "plate" "text" NOT NULL,
    "type" "text" DEFAULT 'cars'::"text",
    "purchase_price" numeric(14,2),
    "chassi" "text",
    "renavam" "text",
    "show_fipe_price" boolean DEFAULT false NOT NULL,
    CONSTRAINT "vehicles_type_check" CHECK (("type" = ANY (ARRAY['cars'::"text", 'motorcycles'::"text", 'trucks'::"text"])))
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sales_search_view" AS
 SELECT "s"."id",
    "s"."vehicle_id",
    "s"."customer_id",
    "s"."seller_id",
    "s"."status",
    "s"."total_value",
    "s"."sub_total",
    "s"."discount_type",
    "s"."discount_value",
    "s"."payment_method",
    "s"."fiscal_observations",
    "s"."commission_percent_applied",
    "s"."sale_date",
    "s"."created_at",
    "s"."updated_at",
    "s"."created_by",
    "s"."updated_by",
    "c"."name" AS "customer_name",
    "c"."cpf_cnpj" AS "customer_cpf_cnpj",
    "c"."email" AS "customer_email",
    "c"."phone" AS "customer_phone",
    "v"."brand" AS "vehicle_brand",
    "v"."model" AS "vehicle_model",
    "v"."plate" AS "vehicle_plate",
    "v"."year_model" AS "vehicle_year_model",
    "u"."name" AS "seller_name",
    "u"."email" AS "seller_email"
   FROM ((("public"."sales" "s"
     LEFT JOIN "public"."customers" "c" ON (("s"."customer_id" = "c"."id")))
     LEFT JOIN "public"."vehicles" "v" ON (("s"."vehicle_id" = "v"."id")))
     LEFT JOIN "public"."users" "u" ON (("s"."seller_id" = "u"."id")));


ALTER VIEW "public"."sales_search_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_attachments" (
    "id" bigint NOT NULL,
    "transaction_id" bigint NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."transaction_attachments" OWNER TO "postgres";


ALTER TABLE "public"."transaction_attachments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transaction_attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transaction_categories" (
    "id" integer NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transaction_categories" OWNER TO "postgres";


ALTER TABLE "public"."transaction_categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."transaction_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "descricao" "text" NOT NULL,
    "valor" numeric(14,2) NOT NULL,
    "data" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metodo_pagamento" "public"."metodo_pagamento" NOT NULL,
    "categoria" "text" DEFAULT 'NAO RELACIONADO'::"text" NOT NULL,
    "tipo" "public"."tipos_transacao" NOT NULL,
    "vehicle_id" bigint,
    "venda_id" bigint,
    "nome_pagador" "text" NOT NULL,
    "cpf_cnpj_pagador" "text" NOT NULL,
    "valor_liquido" numeric(14,2),
    "pendente" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "categoria_id" integer,
    "banco_id" bigint,
    "payment_method_id" integer,
    "customer_id" bigint,
    CONSTRAINT "transactions_sale_payments_revenue_chk" CHECK ((("venda_id" IS NULL) OR ("tipo" = 'RECEITA'::"public"."tipos_transacao")))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE "public"."transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vehicle_documents" (
    "id" bigint NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "category_id" integer,
    "title" "text" NOT NULL,
    "description" "text",
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text",
    "expires_at" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."vehicle_documents" OWNER TO "postgres";


ALTER TABLE "public"."vehicle_documents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."vehicle_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vehicle_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "image_url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "file_size" integer,
    "mime_type" character varying(50),
    "width" integer,
    "height" integer,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."vehicle_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" bigint,
    "url" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "vehicle_videos_type_check" CHECK (("type" = ANY (ARRAY['shorts'::"text", 'wide'::"text"])))
);


ALTER TABLE "public"."vehicle_videos" OWNER TO "postgres";


ALTER TABLE "public"."vehicles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vehicles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."ai_generation_logs"
    ADD CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_titulo_key" UNIQUE ("titulo");



ALTER TABLE ONLY "public"."banners"
    ADD CONSTRAINT "banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_categories"
    ADD CONSTRAINT "document_categories_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."document_categories"
    ADD CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_name", "permission_slug", "id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "transaction_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_categories"
    ADD CONSTRAINT "transaction_categories_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."transaction_categories"
    ADD CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_videos"
    ADD CONSTRAINT "vehicle_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_videos"
    ADD CONSTRAINT "vehicle_videos_vehicle_id_type_key" UNIQUE ("vehicle_id", "type");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_logs_user_month" ON "public"."ai_generation_logs" USING "btree" ("user_id", "month_reference");



CREATE UNIQUE INDEX "idx_customers_active_cpf_cnpj_unique" ON "public"."customers" USING "btree" ("cpf_cnpj") WHERE ("is_deleted" = false);



CREATE UNIQUE INDEX "idx_customers_active_email_unique" ON "public"."customers" USING "btree" ("lower"("email")) WHERE ("is_deleted" = false);



CREATE INDEX "idx_customers_cpf_cnpj" ON "public"."customers" USING "btree" ("cpf_cnpj");



CREATE INDEX "idx_customers_is_deleted" ON "public"."customers" USING "btree" ("is_deleted");



CREATE INDEX "idx_customers_status" ON "public"."customers" USING "btree" ("status");



CREATE INDEX "idx_customers_user_id" ON "public"."customers" USING "btree" ("user_id");



CREATE INDEX "idx_sales_customer_id" ON "public"."sales" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_sale_date" ON "public"."sales" USING "btree" ("sale_date" DESC);



CREATE INDEX "idx_sales_seller_id" ON "public"."sales" USING "btree" ("seller_id");



CREATE INDEX "idx_sales_status" ON "public"."sales" USING "btree" ("status");



CREATE INDEX "idx_sales_vehicle_id" ON "public"."sales" USING "btree" ("vehicle_id");



CREATE INDEX "idx_transaction_attachments_is_deleted" ON "public"."transaction_attachments" USING "btree" ("is_deleted");



CREATE INDEX "idx_transaction_attachments_transaction_id" ON "public"."transaction_attachments" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_banco_id" ON "public"."transactions" USING "btree" ("banco_id");



CREATE INDEX "idx_transactions_categoria_id" ON "public"."transactions" USING "btree" ("categoria_id");



CREATE INDEX "idx_transactions_customer_id" ON "public"."transactions" USING "btree" ("customer_id");



CREATE INDEX "idx_transactions_data" ON "public"."transactions" USING "btree" ("data" DESC);



CREATE INDEX "idx_transactions_is_deleted" ON "public"."transactions" USING "btree" ("is_deleted");



CREATE INDEX "idx_transactions_payment_method_id" ON "public"."transactions" USING "btree" ("payment_method_id");



CREATE INDEX "idx_transactions_tipo" ON "public"."transactions" USING "btree" ("tipo");



CREATE INDEX "idx_transactions_vehicle_id" ON "public"."transactions" USING "btree" ("vehicle_id");



CREATE INDEX "idx_transactions_venda_id" ON "public"."transactions" USING "btree" ("venda_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_vehicle_documents_category_id" ON "public"."vehicle_documents" USING "btree" ("category_id");



CREATE INDEX "idx_vehicle_documents_is_deleted" ON "public"."vehicle_documents" USING "btree" ("is_deleted");



CREATE INDEX "idx_vehicle_documents_vehicle_id" ON "public"."vehicle_documents" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicle_images_vehicle" ON "public"."vehicle_images" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicle_images_vehicle_sort" ON "public"."vehicle_images" USING "btree" ("vehicle_id", "sort_order");



CREATE INDEX "idx_vehicles_chassi" ON "public"."vehicles" USING "btree" ("chassi");



CREATE INDEX "idx_vehicles_renavam" ON "public"."vehicles" USING "btree" ("renavam");



ALTER TABLE ONLY "public"."ai_generation_logs"
    ADD CONSTRAINT "ai_generation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_generation_logs"
    ADD CONSTRAINT "ai_generation_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "fk_vehicles_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "fk_vehicles_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "fk_vehicles_updated_by" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_slug_fkey" FOREIGN KEY ("permission_slug") REFERENCES "public"."permissions"("slug") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "public"."profiles"("name");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "transaction_attachments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "transaction_attachments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "transaction_attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "transaction_attachments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "public"."bank_accounts"("id") ON UPDATE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."transaction_categories"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."sales"("id") NOT VALID;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."document_categories"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_vehicle_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_videos"
    ADD CONSTRAINT "vehicle_videos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated read for permissions" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read access" ON "public"."vehicle_videos" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert customers" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'customers:create'::"text"])))))));



CREATE POLICY "Authenticated users can insert sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'sales:create'::"text", 'vehicles:update'::"text"])))))));



CREATE POLICY "Authenticated users can insert transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can manage bank accounts" ON "public"."bank_accounts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage banners" ON "public"."banners" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage document categories" ON "public"."document_categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage payment methods" ON "public"."payment_methods" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage transaction categories" ON "public"."transaction_categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can read bank accounts" ON "public"."bank_accounts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read customers" ON "public"."customers" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND (EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'customers:view'::"text"]))))))));



CREATE POLICY "Authenticated users can read document categories" ON "public"."document_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read sales" ON "public"."sales" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'sales:view'::"text", 'vehicles:view'::"text"])))))));



CREATE POLICY "Authenticated users can read transaction attachments" ON "public"."transaction_attachments" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "Authenticated users can read transaction categories" ON "public"."transaction_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "Authenticated users can read vehicle documents" ON "public"."vehicle_documents" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "Authenticated users can update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'customers:update'::"text"]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'customers:update'::"text"])))))));



CREATE POLICY "Authenticated users can update sales" ON "public"."sales" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'sales:update'::"text", 'vehicles:update'::"text"]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."profile_id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("rp"."role_name" = ("p"."name")::"text")))
  WHERE (("u"."id" = "auth"."uid"()) AND ((("p"."name")::"text" = 'Administrador'::"text") OR ("rp"."permission_slug" = ANY (ARRAY['admin'::"text", 'sales:update'::"text", 'vehicles:update'::"text"])))))));



CREATE POLICY "Authenticated users can update transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (("is_deleted" = false)) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."sales" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users only" ON "public"."vehicle_videos" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."vehicles" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."vehicle_videos" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."vehicles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."vehicles" FOR SELECT USING (true);



CREATE POLICY "Enable read for authenticated users" ON "public"."sales" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."sales" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."vehicle_videos" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."vehicles" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir atualização por usuários autenticados" ON "public"."app_settings" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir leitura pública das configurações" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "Public read access for banners" ON "public"."banners" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own logs" ON "public"."ai_generation_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own logs" ON "public"."ai_generation_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_generation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_auth_user_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_auth_user_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_auth_user_email"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_generation_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_generation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bank_accounts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bank_accounts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bank_accounts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."banners" TO "anon";
GRANT ALL ON TABLE "public"."banners" TO "authenticated";
GRANT ALL ON TABLE "public"."banners" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."departments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."document_categories" TO "anon";
GRANT ALL ON TABLE "public"."document_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."document_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."sales_search_view" TO "anon";
GRANT ALL ON TABLE "public"."sales_search_view" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_search_view" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_attachments" TO "anon";
GRANT ALL ON TABLE "public"."transaction_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_attachments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transaction_attachments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transaction_attachments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transaction_attachments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_categories" TO "anon";
GRANT ALL ON TABLE "public"."transaction_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transaction_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transaction_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transaction_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_documents" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vehicle_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vehicle_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vehicle_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_images" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_images" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_images" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_videos" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_videos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vehicles_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































