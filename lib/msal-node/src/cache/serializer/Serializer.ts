/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache } from "@azure/msal-common";
import { InMemoryCache, JsonCache, SerializedAccountEntity, SerializedIdTokenEntity, SerializedAccessTokenEntity, SerializedRefreshTokenEntity, SerializedAppMetadataEntity } from "./SerializerTypes";

export class Serializer {
    /**
     * serialize the JSON blob
     * @param data
     */
    static serializeJSONBlob(data: JsonCache): string {
        return JSON.stringify(data);
    }

    /**
     * Serialize Accounts
     * @param accCache
     */
    static serializeAccounts(accCache: AccountCache): Record<string, SerializedAccountEntity> {
        const accounts: Record<string, SerializedAccountEntity> = {};
        Object.keys(accCache).map(function (key) {
            const accountEntity = accCache[key];
            accounts[key] = {
                home_account_id: accountEntity.homeAccountId,
                environment: accountEntity.environment,
                realm: accountEntity.realm,
                local_account_id: accountEntity.localAccountId,
                username: accountEntity.username,
                authority_type: accountEntity.authorityType,
                name: accountEntity.name,
                client_info: accountEntity.clientInfo,
                last_modification_time: accountEntity.lastModificationTime,
                last_modification_app: accountEntity.lastModificationApp,
            };
        });

        return accounts;
    }

    /**
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: IdTokenCache): Record<string, SerializedIdTokenEntity> {
        const idTokens: Record<string, SerializedIdTokenEntity> = {};
        Object.keys(idTCache).map(function (key) {
            const idTEntity = idTCache[key];
            idTokens[key] = {
                home_account_id: idTEntity.homeAccountId,
                environment: idTEntity.environment,
                credential_type: idTEntity.credentialType,
                client_id: idTEntity.clientId,
                secret: idTEntity.secret,
                realm: idTEntity.realm,
            };
        });

        return idTokens;
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: AccessTokenCache): Record<string, SerializedAccessTokenEntity> {
        const accessTokens: Record<string, SerializedAccessTokenEntity> = {};
        Object.keys(atCache).map(function (key) {
            const atEntity = atCache[key];
            accessTokens[key] = {
                home_account_id: atEntity.homeAccountId,
                environment: atEntity.environment,
                credential_type: atEntity.credentialType,
                client_id: atEntity.clientId,
                secret: atEntity.secret,
                realm: atEntity.realm,
                target: atEntity.target,
                cached_at: atEntity.cachedAt,
                expires_on: atEntity.expiresOn,
                extended_expires_on: atEntity.extendedExpiresOn,
                refresh_on: atEntity.refreshOn,
                key_id: atEntity.keyId,
                token_type: atEntity.tokenType,
            };
        });

        return accessTokens;
    }

    /**
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: RefreshTokenCache): Record<string, SerializedRefreshTokenEntity> {
        const refreshTokens: Record<string, SerializedRefreshTokenEntity> = {};
        Object.keys(rtCache).map(function (key) {
            const rtEntity = rtCache[key];
            refreshTokens[key] = {
                home_account_id: rtEntity.homeAccountId,
                environment: rtEntity.environment,
                credential_type: rtEntity.credentialType,
                client_id: rtEntity.clientId,
                secret: rtEntity.secret,
                family_id: rtEntity.familyId,
                target: rtEntity.target,
                realm: rtEntity.realm,
                token_type: rtEntity.tokenType
            };
        });

        return refreshTokens;
    }

    /**
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: AppMetadataCache): Record<string, SerializedAppMetadataEntity> {
        const appMetadata: Record<string, SerializedAppMetadataEntity> = {};
        Object.keys(amdtCache).map(function (key) {
            const amdtEntity = amdtCache[key];
            appMetadata[key] = {
                client_id: amdtEntity.clientId,
                environment: amdtEntity.environment,
                family_id: amdtEntity.familyId,
            };
        });

        return appMetadata;
    }

    /**
     * Serialize the cache
     * @param jsonContent
     */
    static serializeAllCache(inMemCache: InMemoryCache): JsonCache {
        return {
            Account: this.serializeAccounts(inMemCache.accounts),
            IdToken: this.serializeIdTokens(inMemCache.idTokens),
            AccessToken: this.serializeAccessTokens(inMemCache.accessTokens),
            RefreshToken: this.serializeRefreshTokens(inMemCache.refreshTokens),
            AppMetadata: this.serializeAppMetadata(inMemCache.appMetadata),
        };
    }
}
